// Shared constants for the application

export const MENTIONED_COMPANY = 'BATCH';

export const COMPETITORS = [
    'Cornbread Hemp',
    'CBDistillery',
    'Lazarus Naturals',
    'Joy Organics',
    'Medterra',
    'CBDfx',
    'Five CBD',
];

// Regex patterns for analysis
export const YES_NO_REGEX = /^\s*(Yes|No)\s*$/i;
export const RANKING_REGEX = /(?:#+|\*\*)?\s*Forced Ranking.*?\n+([\s\S]*?)(?=(?:\n{1,}(?:#+|\*\*|$)|\n{2,}|$))/i;
export const RANK_ITEM_REGEX = /^\s*(?:\d+\.|##\s*\d+\.)\s*(?:\*\*(.*?)\*\*(?::|\s*-|\s|$)|(.+?)(?::|\s*-|\s|$))/gm;
export const SENTIMENTS_REGEX = /###SENTIMENTS:\s*([0-1](?:\.\d+)?)/i; 