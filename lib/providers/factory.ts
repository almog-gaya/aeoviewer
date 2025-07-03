import { LLMProvider, LLMConfig, LLMEngine, LLMProviderFactory } from './base';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import { PerplexityProvider } from './perplexity';
import { GrokProvider } from './grok';

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

    public getProvider(engine: LLMEngine, config?: LLMConfig): LLMProvider {
        const cacheKey = `${engine}_${config?.apiKey?.substring(0, 8) || 'default'}`;
        
        if (this.providers.has(cacheKey)) {
            return this.providers.get(cacheKey)!;
        }

        const finalConfig = this.getConfigForEngine(engine, config);
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

    private getConfigForEngine(engine: LLMEngine, userConfig?: LLMConfig): LLMConfig {
        const defaultConfigs: Record<LLMEngine, Partial<LLMConfig>> = {
            [LLMEngine.OPENAI]: {
                model: 'gpt-4o-mini',
                maxTokens: 1024,
                temperature: 0.7,
            },
            [LLMEngine.CLAUDE]: {
                model: 'claude-3-haiku-20240307',
                maxTokens: 1024,
                temperature: 0.7,
            },
            [LLMEngine.GEMINI]: {
                model: 'gemini-1.5-flash',
                maxTokens: 1024,
                temperature: 0.7,
            },
            [LLMEngine.PERPLEXITY]: {
                model: 'llama-3.1-sonar-small-128k-online',
                maxTokens: 1024,
                temperature: 0.7,
            },
            [LLMEngine.GROK]: {
                model: 'grok-beta',
                maxTokens: 1024,
                temperature: 0.7,
            },
        };

        const apiKey = userConfig?.apiKey || this.getAPIKeyForEngine(engine);
        if (!apiKey) {
            throw new Error(`API key not found for engine: ${engine}`);
        }

        return {
            apiKey,
            ...defaultConfigs[engine],
            ...userConfig,
        };
    }

    private getAPIKeyForEngine(engine: LLMEngine): string | undefined {
        const keyMap: Record<LLMEngine, string> = {
            [LLMEngine.OPENAI]: 'OPENAI_API_KEY',
            [LLMEngine.CLAUDE]: 'ANTHROPIC_API_KEY',
            [LLMEngine.GEMINI]: 'GEMINI_API_KEY',
            [LLMEngine.PERPLEXITY]: 'PERPLEX_API_KEY',
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

    public clearCache(): void {
        this.providers.clear();
    }
}

// Convenience functions for easy access
export const llmFactory = LLMFactory.getInstance();

export function getProvider(engine: LLMEngine, config?: LLMConfig): LLMProvider {
    return llmFactory.getProvider(engine, config);
}

export function getAvailableEngines(): LLMEngine[] {
    return llmFactory.getAvailableEngines();
}

export function isEngineAvailable(engine: LLMEngine): boolean {
    return llmFactory.isEngineAvailable(engine);
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