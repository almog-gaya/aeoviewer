// Backward compatibility - Re-export from new provider system
import { LLMEngine, getProvider } from './providers';

export const llmProviders = {
    chatgpt: getProvider(LLMEngine.OPENAI),
    claude: getProvider(LLMEngine.CLAUDE),
    gemini: getProvider(LLMEngine.GEMINI),
    perplexity: getProvider(LLMEngine.PERPLEXITY),
    // searchgpt: getProvider(LLMEngine.SEARCHGPT),
    // grok: getProvider(LLMEngine.GROK),
};

// Export types for backward compatibility
export type { LLMProvider } from './providers/base';