// Backward compatibility - Re-export from new provider system
import { LLMEngine, getProvider, TaskType, getProviderForTask } from './providers';

// Legacy provider exports for backward compatibility
export const llmProviders = {
    searchgpt: getProvider(LLMEngine.SEARCHGPT, undefined, TaskType.SCANNING),
    claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.SCANNING),
    gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.SCANNING),
    perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.SCANNING),
    // grok: getProvider(LLMEngine.GROK, undefined, TaskType.SCANNING),
    chatgpt: getProvider(LLMEngine.OPENAI, undefined, TaskType.SCANNING),
};

// Task-specific provider access for better performance
export const taskProviders = {
    // High-quality models for analysis tasks
    analysis: {
        claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.ANALYSIS),
        openai: getProvider(LLMEngine.OPENAI, undefined, TaskType.ANALYSIS),
        gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.ANALYSIS),
        perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.ANALYSIS), 
        searchgpt: getProvider(LLMEngine.SEARCHGPT, undefined, TaskType.ANALYSIS),
    },
    
    // Best models for company profile generation
    profile: {
        claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.PROFILE_GENERATION),
        openai: getProvider(LLMEngine.OPENAI, undefined, TaskType.PROFILE_GENERATION),
        gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.PROFILE_GENERATION),
        perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.PROFILE_GENERATION),
    },
    
    // Optimized models for query generation
    query: {
        claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.QUERY_GENERATION),
        openai: getProvider(LLMEngine.OPENAI, undefined, TaskType.QUERY_GENERATION),
        gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.QUERY_GENERATION),
        perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.QUERY_GENERATION),
    },
    
    // High-quality models for response analysis
    response: {
        claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.RESPONSE_ANALYSIS),
        openai: getProvider(LLMEngine.OPENAI, undefined, TaskType.RESPONSE_ANALYSIS),
        gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.RESPONSE_ANALYSIS),
        perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.RESPONSE_ANALYSIS),
        searchgpt: getProvider(LLMEngine.SEARCHGPT, undefined, TaskType.RESPONSE_ANALYSIS),
    },
    
    // Fast scanning models (cost-effective)
    scanning: {
        openai: getProvider(LLMEngine.OPENAI, undefined, TaskType.SCANNING),
        claude: getProvider(LLMEngine.CLAUDE, undefined, TaskType.SCANNING),
        gemini: getProvider(LLMEngine.GEMINI, undefined, TaskType.SCANNING),
        perplexity: getProvider(LLMEngine.PERPLEXITY, undefined, TaskType.SCANNING),
        grok: getProvider(LLMEngine.GROK, undefined, TaskType.SCANNING),
        searchgpt: getProvider(LLMEngine.SEARCHGPT, undefined, TaskType.SCANNING),
    }
};

// Convenience functions for getting the best provider for a task
export const getBestProvider = {
    analysis: () => getProviderForTask(TaskType.ANALYSIS),
    profile: () => getProviderForTask(TaskType.PROFILE_GENERATION),
    query: () => getProviderForTask(TaskType.QUERY_GENERATION),
    response: () => getProviderForTask(TaskType.RESPONSE_ANALYSIS),
    scanning: () => getProviderForTask(TaskType.SCANNING),
};

// Re-export everything from the providers module for full access
export * from './providers';

// Export types for backward compatibility
export type { LLMProvider } from './providers/base';