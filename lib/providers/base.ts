import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { DialogueTurn } from '@/types/Planner';
import { PromptResult } from '@/types/PromptResult';
import { RedditThread } from '@/types/RedditThread';
import { RegionDistributionStrategy } from '@/lib/vpn/region-manager';

export interface LLMProvider {
    generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult>;
    generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile>;
    generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]>;
    generatePlan(companyProfile: CompanyProfile): Promise<DialogueTurn[]>;
    generateRedditThreads(companyProfile: CompanyProfile): Promise<RedditThread[]>;
}

export interface LLMConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    taskType?: string;
    // VPN-related configuration
    useVPN?: boolean;
    preferredRegion?: string;
    regionStrategy?: RegionDistributionStrategy;
    vpnTimeout?: number;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export enum LLMEngine {
    OPENAI = 'openai',
    CLAUDE = 'claude', 
    GEMINI = 'gemini',
    PERPLEXITY = 'perplexity',
    GROK = 'grok'
}

export enum TaskType {
    SCANNING = 'scanning',
    ANALYSIS = 'analysis',
    PROFILE_GENERATION = 'profile',
    QUERY_GENERATION = 'query',
    RESPONSE_ANALYSIS = 'response'
}

export interface LLMProviderFactory {
    getProvider(engine: LLMEngine, config?: LLMConfig, taskType?: TaskType): LLMProvider;
}

export abstract class BaseLLMProvider implements LLMProvider {
    protected config: LLMConfig;
    
    constructor(config: LLMConfig) {
        this.config = config;
    }

    abstract generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult>;
    abstract generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile>;
    abstract generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]>;
    abstract generatePlan(companyProfile: CompanyProfile): Promise<DialogueTurn[]>;
    abstract generateRedditThreads(companyProfile: CompanyProfile): Promise<RedditThread[]>;

    protected handleError(error: any, operation: string): never {
        console.error(`Error in ${operation} using model ${this.config.model}:`, error);
        throw new Error(`Failed to ${operation}: ${error.message}`);
    }

    protected parseJSONResponse(response: string, fallback: any = null): any {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.warn(`Failed to parse JSON response from model ${this.config.model}:`, error);
            return fallback;
        }
    }

    protected getModelInfo(): string {
        return `${this.config.model} (${this.config.maxTokens} tokens, temp: ${this.config.temperature})`;
    }

    protected async makeVPNRequest(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
        headers: Record<string, string> = {},
        body?: string
    ): Promise<any> {
        // If VPN is not enabled, use regular fetch
        if (!this.config.useVPN) {
            const response = await fetch(url, {
                method,
                headers,
                body,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        }

        // Use VPN-aware HTTP client
        const { vpnHttpClient } = await import('@/lib/vpn/http-client');
        const { regionManager } = await import('@/lib/vpn/region-manager');
        
        const regionSelection = this.config.preferredRegion
            ? { region: this.config.preferredRegion, reason: 'user_preference' }
            : regionManager.selectRegion(this.config.regionStrategy || 'round_robin');

        const startTime = Date.now();
        let response;

        try {
            response = await vpnHttpClient.request({
                method,
                url,
                headers,
                body,
                region: regionSelection.region,
                timeout: this.config.vpnTimeout || 30000,
            });

            const responseTime = Date.now() - startTime;
            
            // Update region stats
            regionManager.updateRegionStats(regionSelection.region, true, responseTime);
            regionManager.setLastRegionUsed(regionSelection.region);

            console.log(`VPN request successful: ${response.vpnUsed} (${response.region}) - ${responseTime}ms`);
            
            return response.data;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Update region stats
            regionManager.updateRegionStats(regionSelection.region, false, responseTime);
            
            console.error(`VPN request failed: ${regionSelection.region} - ${responseTime}ms`, error);
            throw error;
        }
    }
} 