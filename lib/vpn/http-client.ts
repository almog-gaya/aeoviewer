import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { VPNConfig, vpnConfigManager } from './config';

export interface ProxyRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  region?: string;
  vpnId?: string;
  maxRetries?: number;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  vpnUsed?: string;
  region?: string;
  responseTime?: number;
}

export class VPNHttpClient {
  private static instance: VPNHttpClient;
  private healthCheckCache: Map<string, { isHealthy: boolean; lastCheck: Date }> = new Map();

  private constructor() {}

  public static getInstance(): VPNHttpClient {
    if (!VPNHttpClient.instance) {
      VPNHttpClient.instance = new VPNHttpClient();
    }
    return VPNHttpClient.instance;
  }

  private createProxyAgent(vpnConfig: VPNConfig): HttpsProxyAgent<string> | SocksProxyAgent | null {
    const { protocol, host, port, username, password } = vpnConfig;
    
    // Test mode - skip proxy for testing (when host starts with "test-")
    if (host.startsWith('test-')) {
      return null;
    }
    
    if (protocol === 'socks4' || protocol === 'socks5') {
      const authString = username && password ? `${username}:${password}@` : '';
      const proxyUrl = `${protocol}://${authString}${host}:${port}`;
      return new SocksProxyAgent(proxyUrl);
    } else {
      // HTTP/HTTPS proxy
      const authString = username && password ? `${username}:${password}@` : '';
      const proxyUrl = `${protocol}://${authString}${host}:${port}`;
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  private async makeRequestWithVPN(
    options: ProxyRequestOptions,
    vpnConfig: VPNConfig
  ): Promise<ProxyResponse> {
    const startTime = Date.now();
    
    try {
      const agent = this.createProxyAgent(vpnConfig);
      
      const fetchOptions: RequestInit = {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
      };

      // Only add agent if not in test mode
      if (agent) {
        // @ts-ignore - agent is valid for node-fetch
        fetchOptions.agent = agent;
        console.log(`Using VPN proxy: ${vpnConfig.id} (${vpnConfig.region})`);
      } else {
        console.log(`Test mode: Using direct connection for ${vpnConfig.id} (${vpnConfig.region})`);
      }

      const response = await fetch(options.url, fetchOptions);
      const responseTime = Date.now() - startTime;

      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Update VPN health based on successful response
      vpnConfigManager.updateVPNHealth(vpnConfig.id, true, responseTime);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        vpnUsed: vpnConfig.id,
        region: vpnConfig.region,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update VPN health based on failed response
      vpnConfigManager.updateVPNHealth(vpnConfig.id, false, responseTime);
      
      console.error(`VPN request failed with ${vpnConfig.id}:`, error);
      throw error;
    }
  }

  public async request(options: ProxyRequestOptions): Promise<ProxyResponse> {
    const {
      region,
      vpnId,
      maxRetries = 3,
    } = options;

    // If specific VPN is requested, use it
    if (vpnId) {
      const vpnConfig = vpnConfigManager.getVPNConfig(vpnId);
      if (!vpnConfig) {
        throw new Error(`VPN config not found: ${vpnId}`);
      }
      if (!vpnConfig.enabled) {
        throw new Error(`VPN is disabled: ${vpnId}`);
      }
      return this.makeRequestWithVPN(options, vpnConfig);
    }

    // Get available regions
    const availableRegions = vpnConfigManager.getAvailableRegions();
    if (availableRegions.length === 0) {
      throw new Error('No VPN regions available');
    }

    // Select region
    const targetRegion = region || availableRegions[Math.floor(Math.random() * availableRegions.length)];
    
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const vpnConfig = vpnConfigManager.getNextVPNInRegion(targetRegion);
        if (!vpnConfig) {
          throw new Error(`No healthy VPN available in region: ${targetRegion}`);
        }

        console.log(`Attempting request via VPN: ${vpnConfig.id} (${vpnConfig.region})`);
        return await this.makeRequestWithVPN(options, vpnConfig);

      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts < maxRetries) {
          console.log(`Request failed, retrying... (${attempts}/${maxRetries})`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    throw lastError || new Error('All VPN requests failed');
  }

  public async healthCheck(vpnId: string): Promise<boolean> {
    const vpnConfig = vpnConfigManager.getVPNConfig(vpnId);
    if (!vpnConfig) {
      return false;
    }

    // Check cache first
    const cached = this.healthCheckCache.get(vpnId);
    if (cached && (Date.now() - cached.lastCheck.getTime()) < 60000) { // 1 minute cache
      return cached.isHealthy;
    }

    try {
      const response = await this.makeRequestWithVPN({
        method: 'GET',
        url: 'https://httpbin.org/ip',
        timeout: 10000,
      }, vpnConfig);

      const isHealthy = response.status === 200;
      this.healthCheckCache.set(vpnId, {
        isHealthy,
        lastCheck: new Date(),
      });

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for VPN ${vpnId}:`, error);
      this.healthCheckCache.set(vpnId, {
        isHealthy: false,
        lastCheck: new Date(),
      });
      return false;
    }
  }

  public async healthCheckAll(): Promise<Record<string, boolean>> {
    const allVPNs = vpnConfigManager.getAllVPNConfigs();
    const results: Record<string, boolean> = {};

    // Run health checks in parallel
    const healthCheckPromises = allVPNs
      .filter(vpn => vpn.enabled)
      .map(async vpn => {
        const isHealthy = await this.healthCheck(vpn.id);
        results[vpn.id] = isHealthy;
        return { vpnId: vpn.id, isHealthy };
      });

    await Promise.all(healthCheckPromises);
    return results;
  }

  public async getExternalIP(region?: string): Promise<{ ip: string; vpnUsed: string; region: string }> {
    const response = await this.request({
      method: 'GET',
      url: 'https://httpbin.org/ip',
      region,
    });

    return {
      ip: response.data.origin,
      vpnUsed: response.vpnUsed!,
      region: response.region!,
    };
  }

  public async testVPNConnectivity(region?: string): Promise<{
    success: boolean;
    vpnUsed?: string;
    region?: string;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const response = await this.request({
        method: 'GET',
        url: 'https://httpbin.org/get',
        region,
        timeout: 15000,
      });

      return {
        success: true,
        vpnUsed: response.vpnUsed,
        region: response.region,
        responseTime: response.responseTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public clearHealthCheckCache() {
    this.healthCheckCache.clear();
  }
}

export const vpnHttpClient = VPNHttpClient.getInstance(); 