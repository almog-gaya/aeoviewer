# Dashboard Metrics Calculation Guide (Detailed)

This document explains, in detail, how every metric and statistic is calculated on the dashboard page (`app/dashboard/page.tsx`). All variable names, code logic, and edge cases are referenced for clarity.

---

## 1. Data Source
- **Data Fetch:**
  - The dashboard fetches data from `/api/dashboard` via a POST request in `fetchDashboardData`.
  - The response is set to the `prompts` state variable: `const [prompts, setPrompts] = useState<PromptResult[]>([]);`
  - Each item in `prompts` is a `PromptResult` object with fields such as `query_text`, `response_text`, `answer_engine`, `company_mentioned`, `sentiment_score`, `ranking_position`, `mentioned_companies`, `competitors_list`, `rank_list`, `recommended`, `buyer_persona`, `buying_journey_stage`, and `company_name`.

---

## 2. Company Overview Section
- **Total Queries:**
  - `prompts.length`
- **Buyer Personas:**
  - `Array.from(new Set(prompts.map(p => p.buyer_persona).filter(Boolean))).length`
  - Unique, non-empty `buyer_persona` values.
- **Competitors:**
  - `Array.from(new Set(prompts.flatMap(p => (p.competitors_list || [])))).length`
  - Unique names from all `competitors_list` arrays.
- **Journey Stages:**
  - `Array.from(new Set(prompts.map(p => p.buying_journey_stage).filter(Boolean))).length`
  - Unique, non-empty `buying_journey_stage` values.

---

## 3. Buying Journey Metrics
- **Helper Function:** `getMetricsByStage(stageKeywords: string[])`
  - Filters prompts where `buying_journey_stage` includes any keyword (case-insensitive).
  - Returns:
    - `questions`: Number of matching prompts.
    - `responses`: Number with non-empty `response_text`.
    - `visibility`: Percentage with non-null `ranking_position`.
    - `visibilityChange`: Always '0.0' (placeholder).
- **Buying Journey:**
  - `getMetricsByStage(['buying', 'solution'])`
- **Topic Analysis:**
  - `getMetricsByStage(['topic', 'problem'])`

---

## 4. Key Insights Metrics
- **terms:**
  - `Array.from(new Set(prompts.flatMap((p: PromptResult) => (p.query_text || '').split(' ')))).length`
  - Unique words (split by space) from all `query_text` fields.
- **responses:**
  - `prompts.filter((p: PromptResult) => p.response_text && p.response_text.trim() !== '').length`
- **visibility:**
  - `prompts.length > 0 ? (prompts.filter((p: PromptResult) => p.ranking_position !== null && p.ranking_position !== undefined).length / prompts.length * 100).toFixed(1) : '0.0'`
- **visibilityChange:**
  - Always '0.0' (placeholder).

---

## 5. Words Analysis
- **Process:**
  - For each prompt, concatenate `query_text` and `response_text`.
  - Split into words, lowercase, trim, exclude words <3 chars and those in `STOP_WORDS`.
  - For each word:
    - **freq:** Count of appearances.
    - **sentiment:** Average of `sentiment_score` for prompts containing the word (if available).
    - **change:** Not calculated (placeholder).
  - Top 20 words by frequency are shown.
  - Code: see `const wordMap` and `setWords(wordArr)` in the main effect.

---

## 6. Competitor Analysis (Stats Table)
- **Competitor List:**
  - `const companyNames = prompts[0].competitors_list || []` (from first prompt, if available).
- **For each competitor:**
  - **Prompts Selection:**
    - Prompts where competitor is in `mentioned_companies`, `competitors_list`, or (case-insensitive) in `rank_list`.
  - **visibility:**
    - Percentage of these prompts with non-null `ranking_position`.
  - **change:**
    - Always 0 (placeholder).
  - **position:**
    - Average of `ranking_position` for these prompts, or 'N/A'.
  - **sentiment:**
    - Average of `sentiment_score` for these prompts, or 'N/A'.
  - **feature:**
    - Percentage of these prompts with `recommended` true, scaled to 5-point scale.

---

## 7. Brand Visibility by LLM Engine (Chart)
- **LLM_ENGINES:**
  - Array of engines: `searchgpt`, `claude`, `gemini`, `chatgpt`, `perplexity`.
- **For each engine:**
  - Prompts where `(p.answer_engine || '').toLowerCase() === key`.
  - **Visibility:**
    - Percentage of those prompts where `company_mentioned` is true.

---

## 8. Company Mention Percentage
- **companyMentionedCount:**
  - `prompts.filter((p: any) => p.company_mentioned).length`
- **companyMentionedPercent:**
  - `prompts.length > 0 ? ((companyMentionedCount / prompts.length) * 100).toFixed(1) : '0.0'`

---

## 9. Top Competitor Visibility
- **allCompetitors:**
  - `Array.from(new Set(prompts.flatMap((p: PromptResult) => (p.competitors_list || []))))`
- **topCompetitorVisibility:**
  - For each competitor, count prompts where competitor is in `mentioned_companies` (case-insensitive).
  - Calculate percent of total prompts for each; take the max.

---

## 10. Average Ranking (Main Company)
- **helloBatchRanks:**
  - Prompts where `company_mentioned` is true and `ranking_position` is a number.
- **averageRankingText:**
  - Average of `ranking_position` for these prompts, formatted as `${avg.toFixed(1)} of ${nCompetitors}`.
  - If none, 'N/A'.

---

## 11. Competitive Gap
- **competitiveGap:**
  - `parseFloat(companyMentionedPercent) - parseFloat(topCompetitorVisibility)`
  - Difference between main company and top competitor visibility.

---

## 12. Top Performing Competitors
- **topCompetitors:**
  - For each competitor:
    - Count prompts where competitor is in `mentioned_companies` (case-insensitive).
    - Calculate visibility as percent of total prompts.
  - Sort by visibility, take top 3.

---

## 13. Journey Stage Analysis
- **journeyStages:**
  - Unique, non-empty `buying_journey_stage` values.
- **journeyStageStats:**
  - For each stage:
    - `total`: Number of prompts with that stage.
    - `percent`: Percent of all prompts.
    - `companyMentions`: Prompts in that stage with `company_mentioned` true.

---

## 14. Competitive Ranking Table
- **rankingTableData:**
  - For each competitor:
    - Prompts where competitor is in `mentioned_companies` (case-insensitive).
    - **visibility:** Percent of all prompts.
    - **avgPosition:** Average `ranking_position` for those prompts, or 'N/A'.
  - Sorted by visibility descending.
  - **Status:**
    - Based on rank index: 0=Leading, 1=Strong, 2-3=Competitive, 4-5=Moderate, last-2=Low, else=Critical.
    - Main company row is highlighted.

---

## 15. AI Engine Performance Breakdown
- For each engine in `LLM_ENGINES`:
  - Prompts where `(p.answer_engine || '').toLowerCase() === engine.key`.
  - **Mentions:** Number with `company_mentioned` true.
  - **Percent:** Mentions / engine prompts * 100.

---

## 16. Miscellaneous
- **mainCompanyName:**
  - `prompts.length > 0 ? prompts[0].company_name : 'Company'`
- **reportDate:**
  - `new Date().toLocaleDateString()`
- **isReportMode:**
  - Set if URL param `report=1` is present.
- **PDF Generation:**
  - Calls `/api/generate_report/puppeteer-pdf` with current URL.

---

## 17. Placeholders and Edge Cases
- **Change** and **Visibility Change** are placeholders (always 0 or '0.0').
- If `prompts` is empty, all metrics default to 0, 'N/A', or empty arrays.
- All calculations are performed client-side after fetching data.
- Some metrics (e.g., average ranking) are only for the main company (e.g., 'HelloBatch').

---

## 18. Code References
- All calculations are performed in `app/dashboard/page.tsx` in the main component and its effects.
- Helper functions: `getMetricsByStage`, and various inline calculations for each section.
- State variables: `prompts`, `words`, `competitorStats`, `chartData`, etc.

---

For any changes to metric logic, update this document to match the code in `app/dashboard/page.tsx`.
