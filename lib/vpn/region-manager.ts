import { VPNConfig, vpnConfigManager } from './config';
import { vpnHttpClient } from './http-client';

export type RegionDistributionStrategy = 
  | 'round_robin'        // Cycle through regions
  | 'random'            // Random region selection
  | 'geographic_spread' // Spread requests across different geographic areas
  | 'latency_based'     // Prefer regions with lower latency
  | 'load_balanced';    // Balance load across all regions

export interface RegionSelection {
  region: string;
  vpnId?: string;
  reason: string;
}

export interface RegionStats {
  region: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  lastUsed: Date;
  healthyVPNs: number;
  totalVPNs: number;
}

export class RegionManager {
  private static instance: RegionManager;
  private regionIndex: number = 0;
  private regionStats: Map<string, RegionStats> = new Map();
  private lastRegionUsed: string | null = null;
  private requestHistory: Array<{ region: string; timestamp: Date; success: boolean; latency?: number }> = [];

  private constructor() {
    this.initializeRegionStats();
  }

  public static getInstance(): RegionManager {
    if (!RegionManager.instance) {
      RegionManager.instance = new RegionManager();
    }
    return RegionManager.instance;
  }

  private initializeRegionStats() {
    const availableRegions = vpnConfigManager.getAvailableRegions();
    availableRegions.forEach(region => {
      this.regionStats.set(region, {
        region,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        lastUsed: new Date(0),
        healthyVPNs: 0,
        totalVPNs: 0,
      });
    });
  }

  public updateRegionStats(region: string, success: boolean, latency?: number) {
    const stats = this.regionStats.get(region);
    if (!stats) return;

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    stats.lastUsed = new Date();

    if (latency !== undefined) {
      // Update average latency using exponential moving average
      stats.averageLatency = stats.averageLatency === 0 
        ? latency 
        : (stats.averageLatency * 0.7) + (latency * 0.3);
    }

    // Update VPN counts
    const healthyVPNs = vpnConfigManager.getHealthyVPNsInRegion(region);
    const allVPNs = vpnConfigManager.getRegionConfig(region)?.vpnConfigs || [];
    stats.healthyVPNs = healthyVPNs.length;
    stats.totalVPNs = allVPNs.length;

    // Keep request history for analysis (last 100 requests)
    this.requestHistory.push({
      region,
      timestamp: new Date(),
      success,
      latency,
    });
    
    if (this.requestHistory.length > 100) {
      this.requestHistory.shift();
    }
  }

  public updateRegionVPNCounts() {
    // Update VPN counts for all regions without adding to request history
    const availableRegions = vpnConfigManager.getAvailableRegions();
    
    availableRegions.forEach(region => {
      const stats = this.regionStats.get(region);
      if (stats) {
        const healthyVPNs = vpnConfigManager.getHealthyVPNsInRegion(region);
        const allVPNs = vpnConfigManager.getRegionConfig(region)?.vpnConfigs || [];
        stats.healthyVPNs = healthyVPNs.length;
        stats.totalVPNs = allVPNs.length;
      }
    });
  }

  public selectRegion(strategy: RegionDistributionStrategy = 'round_robin'): RegionSelection {
    const availableRegions = vpnConfigManager.getAvailableRegions();
    
    if (availableRegions.length === 0) {
      throw new Error('No available regions');
    }

    if (availableRegions.length === 1) {
      return {
        region: availableRegions[0],
        reason: 'only_region_available',
      };
    }

    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(availableRegions);
      
      case 'random':
        return this.selectRandom(availableRegions);
      
      case 'geographic_spread':
        return this.selectGeographicSpread(availableRegions);
      
      case 'latency_based':
        return this.selectLatencyBased(availableRegions);
      
      case 'load_balanced':
        return this.selectLoadBalanced(availableRegions);
      
      default:
        return this.selectRoundRobin(availableRegions);
    }
  }

  private selectRoundRobin(regions: string[]): RegionSelection {
    const region = regions[this.regionIndex % regions.length];
    this.regionIndex++;
    return {
      region,
      reason: 'round_robin',
    };
  }

  private selectRandom(regions: string[]): RegionSelection {
    const region = regions[Math.floor(Math.random() * regions.length)];
    return {
      region,
      reason: 'random',
    };
  }

  private selectGeographicSpread(regions: string[]): RegionSelection {
    // Try to select a region from a different geographic area than the last used
    const lastUsedRegion = this.lastRegionUsed;
    if (!lastUsedRegion) {
      return this.selectRandom(regions);
    }

    // Group regions by geographic area
    const geoAreas: Record<string, string[]> = {
      'north_america': regions.filter(r => r.startsWith('us-')),
      'europe': regions.filter(r => r.startsWith('eu-')),
      'asia_pacific': regions.filter(r => r.startsWith('ap-')),
    };

    // Find the geographic area of the last used region
    let lastUsedArea: string | null = null;
    for (const [area, areaRegions] of Object.entries(geoAreas)) {
      if (areaRegions.includes(lastUsedRegion)) {
        lastUsedArea = area;
        break;
      }
    }

    if (!lastUsedArea) {
      return this.selectRandom(regions);
    }

    // Try to select from a different area
    const otherAreas = Object.entries(geoAreas)
      .filter(([area]) => area !== lastUsedArea)
      .flatMap(([, areaRegions]) => areaRegions)
      .filter(region => regions.includes(region));

    if (otherAreas.length > 0) {
      const region = otherAreas[Math.floor(Math.random() * otherAreas.length)];
      return {
        region,
        reason: 'geographic_spread',
      };
    }

    // If no other areas available, use round robin
    return this.selectRoundRobin(regions);
  }

  private selectLatencyBased(regions: string[]): RegionSelection {
    // Select region with lowest average latency
    const regionStats = regions
      .map(region => ({
        region,
        stats: this.regionStats.get(region),
      }))
      .filter(({ stats }) => stats && stats.totalRequests > 0)
      .sort((a, b) => (a.stats?.averageLatency || 999999) - (b.stats?.averageLatency || 999999));

    if (regionStats.length > 0) {
      return {
        region: regionStats[0].region,
        reason: 'latency_based',
      };
    }

    // If no latency data, use round robin
    return this.selectRoundRobin(regions);
  }

  private selectLoadBalanced(regions: string[]): RegionSelection {
    // Select region with lowest load (considering success rate and request count)
    const regionStats = regions
      .map(region => ({
        region,
        stats: this.regionStats.get(region),
      }))
      .filter(({ stats }) => stats);

    if (regionStats.length === 0) {
      return this.selectRoundRobin(regions);
    }

    // Calculate load score (lower is better)
    const scoredRegions = regionStats.map(({ region, stats }) => {
      const successRate = stats!.totalRequests > 0 
        ? stats!.successfulRequests / stats!.totalRequests 
        : 1;
      
      const loadScore = stats!.totalRequests * (1 - successRate) + 
                       (stats!.averageLatency / 1000) + 
                       (stats!.healthyVPNs === 0 ? 1000 : 0);
      
      return { region, loadScore };
    });

    scoredRegions.sort((a, b) => a.loadScore - b.loadScore);

    return {
      region: scoredRegions[0].region,
      reason: 'load_balanced',
    };
  }

  public getRegionStats(region?: string): RegionStats | RegionStats[] {
    if (region) {
      return this.regionStats.get(region) || {
        region,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        lastUsed: new Date(0),
        healthyVPNs: 0,
        totalVPNs: 0,
      };
    }

    return Array.from(this.regionStats.values());
  }

  public getRecommendedRegion(excludeRegions: string[] = []): RegionSelection {
    // Get a weighted recommendation based on success rate, latency, and availability
    const availableRegions = vpnConfigManager.getAvailableRegions()
      .filter(region => !excludeRegions.includes(region));

    if (availableRegions.length === 0) {
      throw new Error('No available regions after exclusions');
    }

    const regionScores = availableRegions.map(region => {
      const stats = this.regionStats.get(region);
      if (!stats) {
        return { region, score: 0 };
      }

      // Calculate composite score
      const successRate = stats.totalRequests > 0 
        ? stats.successfulRequests / stats.totalRequests 
        : 1;
      
      const latencyScore = stats.averageLatency > 0 
        ? Math.max(0, 1 - (stats.averageLatency / 5000)) // Normalize latency (5s max)
        : 1;
      
      const availabilityScore = stats.totalVPNs > 0 
        ? stats.healthyVPNs / stats.totalVPNs 
        : 0;

      // Weighted composite score
      const score = (successRate * 0.4) + (latencyScore * 0.3) + (availabilityScore * 0.3);
      
      return { region, score };
    });

    // Sort by score (highest first)
    regionScores.sort((a, b) => b.score - a.score);

    return {
      region: regionScores[0].region,
      reason: 'recommended_composite_score',
    };
  }

  public async runHealthChecks(): Promise<Record<string, boolean>> {
    console.log('Running VPN health checks across all regions...');
    const healthResults = await vpnHttpClient.healthCheckAll();
    
    // Update region stats based on health check results
    for (const [vpnId, isHealthy] of Object.entries(healthResults)) {
      const vpnConfig = vpnConfigManager.getVPNConfig(vpnId);
      if (vpnConfig) {
        this.updateRegionStats(vpnConfig.region, isHealthy);
      }
    }

    return healthResults;
  }

  public getRequestHistory(): Array<{ region: string; timestamp: Date; success: boolean; latency?: number }> {
    return [...this.requestHistory];
  }

  public clearStats() {
    this.regionStats.clear();
    this.requestHistory = [];
    this.regionIndex = 0;
    this.lastRegionUsed = null;
    this.initializeRegionStats();
  }

  public setLastRegionUsed(region: string) {
    this.lastRegionUsed = region;
  }

  public getLastRegionUsed(): string | null {
    return this.lastRegionUsed;
  }
}

export const regionManager = RegionManager.getInstance(); 