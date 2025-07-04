
// Regex patterns for analysis
export const YES_NO_REGEX = /^\s*(Yes|No)\s*$/i;
export const RANKING_REGEX = /(?:#+|\*\*)?\s*Forced Ranking.*?\n+([\s\S]*?)(?=(?:\n{1,}(?:#+|\*\*|$)|\n{2,}|$))/i;
export const RANK_ITEM_REGEX = /^\s*(?:\d+\.|##\s*\d+\.)\s*(?:\*\*(.*?)\*\*(?::|\s*-|\s|$)|(.+?)(?::|\s*-|\s|$))/gm;
export const SENTIMENTS_REGEX = /###SENTIMENTS:\s*([0-1](?:\.\d+)?)/i;


// LLMs to show in the chart and metrics
export const LLM_ENGINES = [
    { key: 'searchgpt', label: 'SearchGPT', color: '#673AB7' },
    { key: 'claude', label: 'Claude', color: '#2196F3' },
    { key: 'gemini', label: 'Gemini', color: '#E91E63' },
    { key: 'chatgpt', label: 'ChatGPT', color: '#4CAF50' },
    { key: 'perplexity', label: 'Perplexity', color: '#FF9800' },
];

// Stop words to exclude from word analysis
export const STOP_WORDS = new Set([
    'the', 'and', 'or', 'not', 'but', 'if', 'then', 'else', 'when', 'where', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
]);