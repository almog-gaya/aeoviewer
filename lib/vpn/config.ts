export interface VPNConfig {
  id: string;
  name: string;
  region: string;
  country: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  priority: number; // Higher number = higher priority
  latency?: number; // ms - will be measured
  lastHealthCheck?: Date;
  isHealthy?: boolean;
}

export interface RegionConfig {
  region: string;
  name: string;
  vpnConfigs: VPNConfig[];
  loadBalanceStrategy: 'round_robin' | 'priority' | 'latency' | 'random';
  maxRetries: number;
  healthCheckInterval: number; // minutes
}

export class VPNConfigManager {
  private static instance: VPNConfigManager;
  private configs: Map<string, VPNConfig> = new Map();
  private regions: Map<string, RegionConfig> = new Map();
  private currentRegionIndex: Map<string, number> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
  }

  public static getInstance(): VPNConfigManager {
    if (!VPNConfigManager.instance) {
      VPNConfigManager.instance = new VPNConfigManager();
    }
    return VPNConfigManager.instance;
  }

  private initializeDefaultConfigs() {
            // Default VPN configurations with hardcoded test endpoints
        const defaultConfigs: VPNConfig[] = [
            // US East - Test mode (no proxy, for testing VPN system logic)
            {
                id: 'us-east-1',
                name: 'US East 1 (Test Mode)',
                region: 'us-east',
                country: 'US',
                protocol: 'https',
                host: process.env.VPN_US_EAST_1_HOST || 'test-us-east',
                port: parseInt(process.env.VPN_US_EAST_1_PORT || '80'),
                username: process.env.VPN_US_EAST_1_USERNAME,
                password: process.env.VPN_US_EAST_1_PASSWORD,
                enabled: process.env.VPN_US_EAST_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
                  {
                id: 'us-east-2',
                name: 'US East 2 (Test Mode)',
                region: 'us-east',
                country: 'US',
                protocol: 'https',
                host: process.env.VPN_US_EAST_2_HOST || 'test-us-east-2',
                port: parseInt(process.env.VPN_US_EAST_2_PORT || '80'),
                username: process.env.VPN_US_EAST_2_USERNAME,
                password: process.env.VPN_US_EAST_2_PASSWORD,
                enabled: process.env.VPN_US_EAST_2_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 2,
            },
            // US West - Test mode
            {
                id: 'us-west-1',
                name: 'US West 1 (Test Mode)',
                region: 'us-west',
                country: 'US',
                protocol: 'https',
                host: process.env.VPN_US_WEST_1_HOST || 'test-us-west',
                port: parseInt(process.env.VPN_US_WEST_1_PORT || '80'),
                username: process.env.VPN_US_WEST_1_USERNAME,
                password: process.env.VPN_US_WEST_1_PASSWORD,
                enabled: process.env.VPN_US_WEST_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
            // Europe - Test mode
            {
                id: 'eu-west-1',
                name: 'EU West 1 (Test Mode)',
                region: 'eu-west',
                country: 'UK',
                protocol: 'https',
                host: process.env.VPN_EU_WEST_1_HOST || 'test-eu-west',
                port: parseInt(process.env.VPN_EU_WEST_1_PORT || '80'),
                username: process.env.VPN_EU_WEST_1_USERNAME,
                password: process.env.VPN_EU_WEST_1_PASSWORD,
                enabled: process.env.VPN_EU_WEST_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
                  {
                id: 'eu-central-1',
                name: 'EU Central 1 (Test Mode)',
                region: 'eu-central',
                country: 'DE',
                protocol: 'https',
                host: process.env.VPN_EU_CENTRAL_1_HOST || 'test-eu-central',
                port: parseInt(process.env.VPN_EU_CENTRAL_1_PORT || '80'),
                username: process.env.VPN_EU_CENTRAL_1_USERNAME,
                password: process.env.VPN_EU_CENTRAL_1_PASSWORD,
                enabled: process.env.VPN_EU_CENTRAL_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
            // Asia Pacific - Test mode
            {
                id: 'ap-southeast-1',
                name: 'AP Southeast 1 (Test Mode)',
                region: 'ap-southeast',
                country: 'SG',
                protocol: 'https',
                host: process.env.VPN_AP_SOUTHEAST_1_HOST || 'test-ap-southeast',
                port: parseInt(process.env.VPN_AP_SOUTHEAST_1_PORT || '80'),
                username: process.env.VPN_AP_SOUTHEAST_1_USERNAME,
                password: process.env.VPN_AP_SOUTHEAST_1_PASSWORD,
                enabled: process.env.VPN_AP_SOUTHEAST_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
            {
                id: 'ap-northeast-1',
                name: 'AP Northeast 1 (Test Mode)',
                region: 'ap-northeast',
                country: 'JP',
                protocol: 'https',
                host: process.env.VPN_AP_NORTHEAST_1_HOST || 'test-ap-northeast',
                port: parseInt(process.env.VPN_AP_NORTHEAST_1_PORT || '80'),
                username: process.env.VPN_AP_NORTHEAST_1_USERNAME,
                password: process.env.VPN_AP_NORTHEAST_1_PASSWORD,
                enabled: process.env.VPN_AP_NORTHEAST_1_HOST ? true : process.env.ENABLE_VPN === 'true',
                priority: 1,
            },
    ];

    // Add configs to the map
    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });

    // Initialize region configurations
    const regionConfigs: RegionConfig[] = [
      {
        region: 'us-east',
        name: 'US East',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'us-east'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
      {
        region: 'us-west',
        name: 'US West',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'us-west'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
      {
        region: 'eu-west',
        name: 'EU West',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'eu-west'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
      {
        region: 'eu-central',
        name: 'EU Central',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'eu-central'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
      {
        region: 'ap-southeast',
        name: 'AP Southeast',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'ap-southeast'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
      {
        region: 'ap-northeast',
        name: 'AP Northeast',
        vpnConfigs: defaultConfigs.filter(c => c.region === 'ap-northeast'),
        loadBalanceStrategy: 'priority',
        maxRetries: 3,
        healthCheckInterval: 5,
      },
    ];

    regionConfigs.forEach(config => {
      this.regions.set(config.region, config);
      this.currentRegionIndex.set(config.region, 0);
    });
  }

  public getVPNConfig(id: string): VPNConfig | undefined {
    return this.configs.get(id);
  }

  public getRegionConfig(region: string): RegionConfig | undefined {
    return this.regions.get(region);
  }

  public getAvailableRegions(): string[] {
    return Array.from(this.regions.keys()).filter(region => {
      const config = this.regions.get(region);
      return config?.vpnConfigs.some(vpn => vpn.enabled) ?? false;
    });
  }

  public getHealthyVPNsInRegion(region: string): VPNConfig[] {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) return [];
    
    return regionConfig.vpnConfigs.filter(vpn => 
      vpn.enabled && (vpn.isHealthy !== false)
    );
  }

  public getNextVPNInRegion(region: string): VPNConfig | undefined {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) return undefined;

    const healthyVPNs = this.getHealthyVPNsInRegion(region);
    if (healthyVPNs.length === 0) return undefined;

    let selectedVPN: VPNConfig;

    switch (regionConfig.loadBalanceStrategy) {
      case 'priority':
        selectedVPN = healthyVPNs.sort((a, b) => a.priority - b.priority)[0];
        break;
      
      case 'latency':
        selectedVPN = healthyVPNs.sort((a, b) => 
          (a.latency || 999999) - (b.latency || 999999)
        )[0];
        break;
      
      case 'random':
        selectedVPN = healthyVPNs[Math.floor(Math.random() * healthyVPNs.length)];
        break;
      
      case 'round_robin':
      default:
        const currentIndex = this.currentRegionIndex.get(region) || 0;
        selectedVPN = healthyVPNs[currentIndex % healthyVPNs.length];
        this.currentRegionIndex.set(region, currentIndex + 1);
        break;
    }

    return selectedVPN;
  }

  public getAllVPNConfigs(): VPNConfig[] {
    return Array.from(this.configs.values());
  }

  public updateVPNHealth(vpnId: string, isHealthy: boolean, latency?: number) {
    const config = this.configs.get(vpnId);
    if (config) {
      config.isHealthy = isHealthy;
      config.lastHealthCheck = new Date();
      if (latency !== undefined) {
        config.latency = latency;
      }
    }
  }

  public addVPNConfig(config: VPNConfig) {
    this.configs.set(config.id, config);
    
    // Update region config
    const regionConfig = this.regions.get(config.region);
    if (regionConfig) {
      regionConfig.vpnConfigs.push(config);
    }
  }

  public removeVPNConfig(vpnId: string) {
    const config = this.configs.get(vpnId);
    if (config) {
      this.configs.delete(vpnId);
      
      // Update region config
      const regionConfig = this.regions.get(config.region);
      if (regionConfig) {
        regionConfig.vpnConfigs = regionConfig.vpnConfigs.filter(
          vpn => vpn.id !== vpnId
        );
      }
    }
  }

  public enableVPN(vpnId: string) {
    const config = this.configs.get(vpnId);
    if (config) {
      config.enabled = true;
    }
  }

  public disableVPN(vpnId: string) {
    const config = this.configs.get(vpnId);
    if (config) {
      config.enabled = false;
    }
  }

  public getVPNStats(): { totalVPNs: number; enabledVPNs: number; healthyVPNs: number; regionCounts: Record<string, number> } {
    const allVPNs = Array.from(this.configs.values());
    const enabledVPNs = allVPNs.filter(vpn => vpn.enabled);
    const healthyVPNs = allVPNs.filter(vpn => vpn.enabled && vpn.isHealthy !== false);
    
    const regionCounts: Record<string, number> = {};
    enabledVPNs.forEach(vpn => {
      regionCounts[vpn.region] = (regionCounts[vpn.region] || 0) + 1;
    });

    return {
      totalVPNs: allVPNs.length,
      enabledVPNs: enabledVPNs.length,
      healthyVPNs: healthyVPNs.length,
      regionCounts,
    };
  }
}

export const vpnConfigManager = VPNConfigManager.getInstance(); 