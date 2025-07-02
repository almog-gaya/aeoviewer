// Backward compatibility - Re-export from new provider system
import { LLMEngine, getProvider } from './providers';

// Legacy export for backward compatibility
export const llmProvider = getProvider(LLMEngine.OPENAI);

// Export types for backward compatibility
export type { LLMProvider } from './providers/base';