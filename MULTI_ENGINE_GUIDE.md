# Multi-Engine AI Implementation Guide

## 🎯 Overview

Your app now supports **5 different AI engines** instead of just OpenAI! Users can select from ChatGPT, Claude, Gemini, Perplexity, and Grok to get diverse perspectives on their queries.

## 🚀 What Was Implemented

### 1. **New Provider Architecture**
- **Base Interface**: `lib/providers/base.ts` - Common interface for all AI engines
- **Individual Providers**: Separate implementations for each AI service
- **Factory Pattern**: `lib/providers/factory.ts` - Manages and creates providers
- **Backward Compatibility**: Existing code continues to work unchanged

### 2. **Supported AI Engines**

| Engine | Provider | Model | Description |
|--------|----------|-------|-------------|
| **OpenAI** | `openai` | gpt-4o-mini | ChatGPT responses |
| **Claude** | `@anthropic-ai/sdk` | claude-3-haiku-20240307 | Anthropic's Claude |
| **Gemini** | `@google/generative-ai` | gemini-1.5-flash | Google's Gemini |
| **Perplexity** | HTTP API | llama-3.1-sonar-small-128k-online | Perplexity AI |
| **Grok** | HTTP API | grok-beta | xAI's Grok |

### 3. **UI Updates**
- Added **Grok checkbox** to the prompt builder
- Engine selection now includes all 5 engines
- Each engine displays with proper branding

### 4. **API Integration**
- **Real API calls** replace mock responses
- **Parallel processing** for multiple engines
- **Error handling** with graceful fallbacks
- **Response analysis** for brand mentions and sentiment

## 🔧 Setup Instructions

### 1. **Environment Variables**
Add these API keys to your `.env` file:

```bash
# Required: OpenAI (existing)
OPENAI_API_KEY=your_openai_key_here

# New AI Engines
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
GROK_API_KEY=your_grok_key_here
```

### 2. **Install Dependencies**
The required packages are already added to `package.json`:

```bash
npm install
```

### 3. **Test the Implementation**
Run the test script to verify all engines work:

```bash
node scripts/test-multi-engines.js
```

## 🛠 How to Use

### **Option 1: Through the UI**
1. Go to `/prompt-builder`
2. Select multiple AI engines (checkboxes)
3. Fill in your brand, competitors, keywords, persona
4. Click "Generate Scan"
5. View responses from each selected engine

### **Option 2: Programmatically**

```typescript
import { getProvider, LLMEngine } from '@/lib/providers';

// Get a specific provider
const claudeProvider = getProvider(LLMEngine.CLAUDE);

// Generate a response
const result = await claudeProvider.generateResponseText(query, company);
```

### **Option 3: Factory Methods**

```typescript
import { getAvailableEngines, isEngineAvailable } from '@/lib/providers';

// Check which engines are available (have API keys)
const engines = getAvailableEngines();
console.log('Available engines:', engines);

// Check if a specific engine is available
if (isEngineAvailable(LLMEngine.GROK)) {
  // Use Grok
}
```

## 📁 File Structure

```
lib/providers/
├── base.ts           # Base interface and types
├── openai.ts         # OpenAI provider
├── claude.ts         # Anthropic Claude provider
├── gemini.ts         # Google Gemini provider
├── perplexity.ts     # Perplexity provider
├── grok.ts           # xAI Grok provider
├── factory.ts        # Provider factory and utilities
└── index.ts          # Main exports

app/api/scan/route.ts # Updated to use real providers
app/prompt-builder/   # Updated UI with Grok option
scripts/test-multi-engines.js # Test script
```

## 🎨 Features

### **1. Engine Selection**
- Users can select 1 or more engines
- Only engines with valid API keys are available
- Error handling for missing keys

### **2. Response Analysis**
- **Brand mentions**: Count, positions, sentiment
- **Competitor analysis**: Mentions and sentiment for each competitor
- **Response quality**: Error handling and fallbacks

### **3. Performance**
- **Parallel processing**: All engines run simultaneously
- **Caching**: Providers are cached for performance
- **Fallback responses**: Errors don't break the entire scan

### **4. Backward Compatibility**
- Existing OpenAI code continues to work
- Legacy `llmProvider` export maintained
- No breaking changes to existing APIs

## 🧪 Testing

### **Test Script Features**
- Tests all available engines
- Verifies API key configuration
- Shows sample responses
- Reports success/failure for each engine

### **Sample Output**
```
🚀 Multi-Engine AI Test Script
================================

📊 Found 3 available engines:
  • ChatGPT (GPT-4)
  • Claude
  • Google Gemini

🧠 Testing ChatGPT (GPT-4)...
  → Testing company profile generation...
  ✅ Company profile: TestCorp
  → Testing response generation...
  ✅ Generated response (245 chars)
  📝 Preview: For a project manager looking for project management tools, here are the top options to consider...

🎯 3/3 engines working correctly
🎉 All engines are working! Your multi-engine setup is ready.
```

## 🚨 Troubleshooting

### **Common Issues**

1. **"Engine not available" errors**
   - Check API keys in `.env` file
   - Ensure keys are valid and have sufficient credits

2. **TypeScript errors**
   - Run `npm install` to install new dependencies
   - Restart your TypeScript server

3. **Build errors**
   - Check that all new files are properly imported
   - Verify environment variables are set

### **API Key Sources**
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **Perplexity**: https://www.perplexity.ai/settings/api
- **Grok**: https://console.x.ai/

## 🔄 Migration Guide

### **From Single Engine (OpenAI)**
Your existing code will continue to work! The `llmProvider` export is maintained for backward compatibility.

### **To Use Multiple Engines**
1. Add new API keys to `.env`
2. Update your UI to let users select engines
3. Use the new factory methods to get providers
4. Process responses from multiple engines

## 🎯 Benefits

1. **Diverse Perspectives**: Different AI models provide varied insights
2. **Redundancy**: If one service is down, others continue working
3. **Cost Optimization**: Choose cheaper models for certain tasks
4. **Performance Comparison**: See which engines work best for your use case
5. **Future-Proof**: Easy to add new engines as they become available

## 📈 Next Steps

1. **Add More Engines**: The architecture makes it easy to add new providers
2. **Response Comparison**: Build features to compare engine outputs
3. **Cost Tracking**: Monitor usage across different providers
4. **Quality Metrics**: Implement scoring for response quality
5. **Custom Models**: Add support for fine-tuned or custom models

---

**🎉 Your app now supports 5 AI engines! Test it out and see the difference in perspectives across different AI models.** 