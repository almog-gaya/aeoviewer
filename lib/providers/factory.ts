import { LLMProvider, LLMConfig, LLMEngine, LLMProviderFactory } from './base';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { PerplexityProvider } from './perplexity';
import { GrokProvider } from './grok';
import { RegionDistributionStrategy } from '@/lib/vpn/region-manager';

export enum TaskType {
    SCANNING = 'scanning',           // Fast, cost-effective models for basic scanning
    ANALYSIS = 'analysis',           // Higher quality models for detailed analysis
    PROFILE_GENERATION = 'profile',  // Best models for company profile generation
    QUERY_GENERATION = 'query',      // Balanced models for query generation
    RESPONSE_ANALYSIS = 'response'   // High-quality models for response analysis
}

export class LLMFactory implements LLMProviderFactory {
    private static instance: LLMFactory;
    private providers: Map<string, LLMProvider> = new Map();

    private constructor() {}

    public static getInstance(): LLMFactory {
        if (!LLMFactory.instance) {
            LLMFactory.instance = new LLMFactory();
        }
        return LLMFactory.instance;
    }

    public getProvider(engine: LLMEngine, config?: LLMConfig, taskType?: TaskType): LLMProvider {
        const cacheKey = `${engine}_${taskType || 'default'}_${config?.apiKey?.substring(0, 8) || 'default'}`;
        
        if (this.providers.has(cacheKey)) {
            return this.providers.get(cacheKey)!;
        }

        const finalConfig = this.getConfigForEngine(engine, config, taskType);
        let provider: LLMProvider;

        switch (engine) {
            case LLMEngine.OPENAI:
                provider = new OpenAIProvider(finalConfig);
                break;
            case LLMEngine.CLAUDE:
                provider = new ClaudeProvider(finalConfig);
                break;
            case LLMEngine.GEMINI:
                provider = new GeminiProvider(finalConfig);
                break;
            case LLMEngine.PERPLEXITY:
                provider = new PerplexityProvider(finalConfig);
                break;
            case LLMEngine.GROK:
                provider = new GrokProvider(finalConfig);
                break;
            default:
                throw new Error(`Unsupported engine: ${engine}`);
        }

        this.providers.set(cacheKey, provider);
        return provider;
    }

    private getConfigForEngine(engine: LLMEngine, userConfig?: LLMConfig, taskType?: TaskType): LLMConfig {
        const task = taskType || TaskType.SCANNING;
        
        // VPN configuration - enable VPN if environment variable is set
        const vpnConfig = {
            useVPN: process.env.ENABLE_VPN === 'true',
            regionStrategy: (process.env.VPN_REGION_STRATEGY as RegionDistributionStrategy) || 'round_robin',
            preferredRegion: process.env.VPN_PREFERRED_REGION,
            vpnTimeout: parseInt(process.env.VPN_TIMEOUT || '30000'),
        };
        
        // Task-specific model configurations
        const taskConfigs: Record<LLMEngine, Record<TaskType, Partial<LLMConfig>>> = {
            [LLMEngine.OPENAI]: {
                [TaskType.SCANNING]: {
                    model: 'gpt-4o-mini',
                    maxTokens: 1024,
                    temperature: 0.7,
                },
                [TaskType.ANALYSIS]: {
                    model: 'gpt-4o',
                    maxTokens: 2048,
                    temperature: 0.5,
                },
                [TaskType.PROFILE_GENERATION]: {
                    model: 'gpt-4o',
                    maxTokens: 2048,
                    temperature: 0.3,
                },
                [TaskType.QUERY_GENERATION]: {
                    model: 'gpt-4o',
                    maxTokens: 2048,
                    temperature: 0.7,
                },
                [TaskType.RESPONSE_ANALYSIS]: {
                    model: 'gpt-4o',
                    maxTokens: 2048,
                    temperature: 0.3,
                }
            },
            [LLMEngine.CLAUDE]: {
                [TaskType.SCANNING]: {
                    model: 'claude-3-haiku-20240307',
                    maxTokens: 1024,
                    temperature: 0.7,
                },
                [TaskType.ANALYSIS]: {
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 2048,
                    temperature: 0.5,
                },
                [TaskType.PROFILE_GENERATION]: {
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 2048,
                    temperature: 0.3,
                },
                [TaskType.QUERY_GENERATION]: {
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 2048,
                    temperature: 0.7,
                },
                [TaskType.RESPONSE_ANALYSIS]: {
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 2048,
                    temperature: 0.3,
                }
            },
            [LLMEngine.GEMINI]: {
                [TaskType.SCANNING]: {
                    model: 'gemini-1.5-flash',
                    maxTokens: 1024,
                    temperature: 0.7,
                },
                [TaskType.ANALYSIS]: {
                    model: 'gemini-1.5-pro',
                    maxTokens: 2048,
                    temperature: 0.5,
                },
                [TaskType.PROFILE_GENERATION]: {
                    model: 'gemini-1.5-pro',
                    maxTokens: 2048,
                    temperature: 0.3,
                },
                [TaskType.QUERY_GENERATION]: {
                    model: 'gemini-1.5-flash',
                    maxTokens: 2048,
                    temperature: 0.7,
                },
                [TaskType.RESPONSE_ANALYSIS]: {
                    model: 'gemini-1.5-pro',
                    maxTokens: 2048,
                    temperature: 0.3,
                }
            },
            [LLMEngine.PERPLEXITY]: {
                [TaskType.SCANNING]: {
                    model: 'llama-3.1-sonar-small-128k-online',
                    maxTokens: 1024,
                    temperature: 0.7,
                },
                [TaskType.ANALYSIS]: {
                    model: 'llama-3.1-sonar-large-128k-online',
                    maxTokens: 2048,
                    temperature: 0.5,
                },
                [TaskType.PROFILE_GENERATION]: {
                    model: 'llama-3.1-sonar-large-128k-online',
                    maxTokens: 2048,
                    temperature: 0.3,
                },
                [TaskType.QUERY_GENERATION]: {
                    model: 'llama-3.1-sonar-small-128k-online',
                    maxTokens: 2048,
                    temperature: 0.7,
                },
                [TaskType.RESPONSE_ANALYSIS]: {
                    model: 'llama-3.1-sonar-large-128k-online',
                    maxTokens: 2048,
                    temperature: 0.3,
                }
            },
            [LLMEngine.GROK]: {
                [TaskType.SCANNING]: {
                    model: 'grok-beta',
                    maxTokens: 1024,
                    temperature: 0.7,
                },
                [TaskType.ANALYSIS]: {
                    model: 'grok-beta',
                    maxTokens: 2048,
                    temperature: 0.5,
                },
                [TaskType.PROFILE_GENERATION]: {
                    model: 'grok-beta',
                    maxTokens: 2048,
                    temperature: 0.3,
                },
                [TaskType.QUERY_GENERATION]: {
                    model: 'grok-beta',
                    maxTokens: 2048,
                    temperature: 0.7,
                },
                [TaskType.RESPONSE_ANALYSIS]: {
                    model: 'grok-beta',
                    maxTokens: 2048,
                    temperature: 0.3,
                }
            },
        };

        const apiKey = userConfig?.apiKey || this.getAPIKeyForEngine(engine);
        if (!apiKey) {
            throw new Error(`API key not found for engine: ${engine}`);
        }

        return {
            apiKey,
            ...taskConfigs[engine][task],
            ...vpnConfig,
            ...userConfig,
        };
    }

    private getAPIKeyForEngine(engine: LLMEngine): string | undefined {
        const keyMap: Record<LLMEngine, string> = {
            [LLMEngine.OPENAI]: 'OPENAI_API_KEY',
            [LLMEngine.CLAUDE]: 'ANTHROPIC_API_KEY',
            [LLMEngine.GEMINI]: 'GEMINI_API_KEY',
            [LLMEngine.PERPLEXITY]: 'PERPLEXITY_API_KEY',
            [LLMEngine.GROK]: 'GROK_API_KEY',
        };

        return process.env[keyMap[engine]];
    }

    public getAvailableEngines(): LLMEngine[] {
        return Object.values(LLMEngine).filter(engine => {
            try {
                return !!this.getAPIKeyForEngine(engine);
            } catch {
                return false;
            }
        });
    }

    public isEngineAvailable(engine: LLMEngine): boolean {
        return !!this.getAPIKeyForEngine(engine);
    }

    // Get the best model for a specific task across all engines
    public getBestEngineForTask(task: TaskType): LLMEngine {
        const taskPreferences: Record<TaskType, LLMEngine[]> = {
            [TaskType.SCANNING]: [LLMEngine.OPENAI, LLMEngine.CLAUDE, LLMEngine.GEMINI],
            [TaskType.ANALYSIS]: [LLMEngine.CLAUDE, LLMEngine.OPENAI, LLMEngine.GEMINI],
            [TaskType.PROFILE_GENERATION]: [LLMEngine.CLAUDE, LLMEngine.OPENAI, LLMEngine.GEMINI],
            [TaskType.QUERY_GENERATION]: [LLMEngine.CLAUDE, LLMEngine.OPENAI, LLMEngine.GEMINI],
            [TaskType.RESPONSE_ANALYSIS]: [LLMEngine.CLAUDE, LLMEngine.OPENAI, LLMEngine.GEMINI],
        };

        const preferences = taskPreferences[task];
        for (const engine of preferences) {
            if (this.isEngineAvailable(engine)) {
                return engine;
            }
        }

        // Fallback to any available engine
        const available = this.getAvailableEngines();
        if (available.length === 0) {
            throw new Error('No AI engines available. Please check your API keys.');
        }
        return available[0];
    }

    // VPN-specific methods
    public getVPNProvider(engine: LLMEngine, config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider {
        const vpnConfig = {
            useVPN: true,
            regionStrategy: 'round_robin' as RegionDistributionStrategy,
            ...config,
        };
        return this.getProvider(engine, vpnConfig as LLMConfig, taskType);
    }

    public getProviderWithRegion(engine: LLMEngine, region: string, config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider {
        const vpnConfig = {
            useVPN: true,
            preferredRegion: region,
            ...config,
        };
        return this.getProvider(engine, vpnConfig as LLMConfig, taskType);
    }

    public getMultiRegionProviders(engine: LLMEngine, regions: string[], config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider[] {
        return regions.map(region => this.getProviderWithRegion(engine, region, config, taskType));
    }

    public async testVPNConnectivity(): Promise<Record<string, boolean>> {
        const { vpnHttpClient } = await import('@/lib/vpn/http-client');
        return await vpnHttpClient.healthCheckAll();
    }

    public async getVPNStatus(): Promise<{
        enabled: boolean;
        availableRegions: string[];
        healthyVPNs: Record<string, boolean>;
        regionStats: any;
    }> {
        const { vpnConfigManager } = await import('@/lib/vpn/config');
        const { regionManager } = await import('@/lib/vpn/region-manager');
        const { vpnHttpClient } = await import('@/lib/vpn/http-client');

        const enabled = process.env.ENABLE_VPN === 'true';
        const availableRegions = vpnConfigManager.getAvailableRegions();
        const healthyVPNs = enabled ? await vpnHttpClient.healthCheckAll() : {};
        
        // Update region stats with current VPN health status
        regionManager.updateRegionVPNCounts();
        const regionStats = regionManager.getRegionStats();

        return {
            enabled,
            availableRegions,
            healthyVPNs,
            regionStats,
        };
    }
}

// Convenience functions for backward compatibility and ease of use
export function getProvider(engine: LLMEngine, config?: LLMConfig, taskType?: TaskType): LLMProvider {
    return LLMFactory.getInstance().getProvider(engine, config, taskType);
}

export function getProviderForTask(task: TaskType, config?: LLMConfig): LLMProvider {
    const factory = LLMFactory.getInstance();
    const bestEngine = factory.getBestEngineForTask(task);
    return factory.getProvider(bestEngine, config, task);
}

export function getAvailableEngines(): LLMEngine[] {
    return LLMFactory.getInstance().getAvailableEngines();
}

export function isEngineAvailable(engine: LLMEngine): boolean {
    return LLMFactory.getInstance().isEngineAvailable(engine);
}

// Engine ID mapping for UI compatibility
export function mapEngineIdToEnum(engineId: string): LLMEngine {
    const mapping: Record<string, LLMEngine> = {
        'gpt4': LLMEngine.OPENAI,
        'openai': LLMEngine.OPENAI,
        'claude': LLMEngine.CLAUDE,
        'gemini': LLMEngine.GEMINI,
        'perplexity': LLMEngine.PERPLEXITY,
        'grok': LLMEngine.GROK,
    };

    return mapping[engineId] || LLMEngine.OPENAI;
}

export function getEngineDisplayName(engine: LLMEngine): string {
    const displayNames: Record<LLMEngine, string> = {
        [LLMEngine.OPENAI]: 'ChatGPT (GPT-4)',
        [LLMEngine.CLAUDE]: 'Claude',
        [LLMEngine.GEMINI]: 'Google Gemini',
        [LLMEngine.PERPLEXITY]: 'Perplexity AI',
        [LLMEngine.GROK]: 'Grok',
    };

    return displayNames[engine] || engine;
}

export function getTaskDisplayName(task: TaskType): string {
    const taskNames: Record<TaskType, string> = {
        [TaskType.SCANNING]: 'Basic Scanning',
        [TaskType.ANALYSIS]: 'Detailed Analysis',
        [TaskType.PROFILE_GENERATION]: 'Company Profile Generation',
        [TaskType.QUERY_GENERATION]: 'Query Generation',
        [TaskType.RESPONSE_ANALYSIS]: 'Response Analysis',
    };

    return taskNames[task] || task;
}

// VPN-specific convenience functions
export function getVPNProvider(engine: LLMEngine, config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider {
    return LLMFactory.getInstance().getVPNProvider(engine, config, taskType);
}

export function getProviderWithRegion(engine: LLMEngine, region: string, config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider {
    return LLMFactory.getInstance().getProviderWithRegion(engine, region, config, taskType);
}

export function getMultiRegionProviders(engine: LLMEngine, regions: string[], config?: Partial<LLMConfig>, taskType?: TaskType): LLMProvider[] {
    return LLMFactory.getInstance().getMultiRegionProviders(engine, regions, config, taskType);
}

export async function testVPNConnectivity(): Promise<Record<string, boolean>> {
    return LLMFactory.getInstance().testVPNConnectivity();
}

export async function getVPNStatus(): Promise<{
    enabled: boolean;
    availableRegions: string[];
    healthyVPNs: Record<string, boolean>;
    regionStats: any;
}> {
    return LLMFactory.getInstance().getVPNStatus();
} 