
## Dashboard Metrics Calculation Guide

This explains how the various metrics and statistics are calculated on the dashboard page (`app/dashboard/page.tsx`).

### 1. Data Source
- All metrics are computed from the `prompts` array, which is fetched from the `/api/dashboard` endpoint. Each item in `prompts` is a `PromptResult` object containing fields such as `query_text`, `response_text`, `answer_engine`, `company_mentioned`, `sentiment_score`, `ranking_position`, `mentioned_companies`, `competitors_list`, `rank_list`, and `recommended`.

---

### 2. Buying Journey Metrics
- **Definition:** Prompts whose `buying_journey_stage` includes the keywords 'buying' or 'solution'.
- **Questions:** Number of prompts matching the above criteria.
- **Responses:** Number of those prompts with a non-empty `response_text`.
- **Visibility:** Percentage of those prompts that have a non-null `ranking_position`.
- **Visibility Change:** Currently always set to '0.0' (placeholder).

---

### 3. Topic Analysis Metrics
- **Definition:** Prompts whose `buying_journey_stage` includes the keywords 'topic' or 'problem'.
- **Questions:** Number of prompts matching the above criteria.
- **Responses:** Number of those prompts with a non-empty `response_text`.
- **Visibility:** Percentage of those prompts that have a non-null `ranking_position`.
- **Visibility Change:** Currently always set to '0.0' (placeholder).

---

### 4. Key Insights Metrics
- **Terms:** Number of unique words (split by space) across all `query_text` fields in all prompts.
- **Responses:** Number of prompts with a non-empty `response_text`.
- **Visibility:** Percentage of all prompts that have a non-null `ranking_position`.
- **Visibility Change:** Currently always set to '0.0' (placeholder).

---

### 5. Words Analysis
- **Process:**
  - All words from `query_text` and `response_text` are extracted, lowercased, and filtered to exclude common stop words and words shorter than 3 characters.
  - For each word, the following are calculated:
    - **Frequency:** Number of times the word appears.
    - **Sentiment:** Average of `sentiment_score` values for prompts containing the word (if available).
    - **Change:** Currently a placeholder (not calculated from data).
  - The top 20 words by frequency are displayed.

---

### 6. Competitor Analysis
- **Competitor List:** Taken from the `competitors_list` field of the first prompt (if available).
- For each competitor:
  - **Prompts Selection:** Prompts are included if the competitor is mentioned in any of the following:
    - `mentioned_companies` array
    - `competitors_list` array
    - `rank_list` string (case-insensitive match)
  - **Visibility:** Percentage of these prompts that have a non-null `ranking_position`.
  - **Change:** Currently always set to 0 (placeholder).
  - **Avg. Position:** Average of `ranking_position` values for these prompts (if available).
  - **Sentiment Score:** Average of `sentiment_score` values for these prompts (if available).
  - **Feature Score:** Percentage of these prompts with `recommended` set to true, scaled to a 5-point scale.

---

### 7. Brand Visibility by LLM Engine (Chart)
- For each LLM engine (e.g., SearchGPT, Claude, Gemini, ChatGPT, Perplexity):
  - **Visibility:** Percentage of prompts answered by that engine where `company_mentioned` is true.

---

### 8. Company Mention Percentage
- **Definition:** Percentage of all prompts where `company_mentioned` is true.

---

### Notes
- Some metrics (e.g., 'Change' and 'Visibility Change') are placeholders and not currently calculated from time-based or historical data.
- All calculations are performed client-side in `app/dashboard/page.tsx` after fetching the data.
