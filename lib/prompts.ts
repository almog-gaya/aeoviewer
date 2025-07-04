import { CompanyProfile } from "@/types/CompanyProfile";
const TOTAL_QUERY_COUNT = 30; //?? process.env.TOTAL_QUERY_GENERATION_LIMIT ? parseInt(process.env.TOTAL_QUERY_GENERATION_LIMIT) : 10;
const TOTAL_REDDIT_THREADS_COUNT = 10; //?? process.env.TOTAL_REDDIT_THREADS_LIMIT ? parseInt(process.env.TOTAL_REDDIT_THREADS_LIMIT) : 10;
export const getResponseTextSystemPrompt = (buyerJourneyStage: string, buyerPersona?: string) => `
You are an expert analyst tasked with responding to a query provided in the user input, with the context of its buying_journey_stage (${buyerJourneyStage}) and buyer_persona (${buyerPersona}). The query may relate to any industry or providers. Deliver accurate, concise responses strictly aligned with the query's intent, buying journey stage, and requested format, using only reliable data.

###Instructions:

1. *Context*: Adapt to the industry or providers in the query. For a specified buyer_persona, tailor to their priorities; if buyer_persona is null, provide broad answers.
2. *Response by Stage*:
    - **General**: Answer with industry trends or insights, unbranded unless providers are named, in concise paragraphs.
    - **Problem Exploration**: Suggest unbranded solutions to pain points in concise paragraphs.
    - **Solution Education**: Describe unbranded tools or solutions in concise paragraphs.
    - **Solution Comparison**: Rank named providers (best to worst) in a numbered list. Use reliable data or state assumptions if data is missing.
    - **User Feedback**: Rank named providers (best to worst) in a numbered list based on user-generated content (e.g., LinkedIn, G2, forums). Cite sentiment or state "No data available" if none exists.
    - **Solution Evaluation**: Answer "Yes," "No," or "I don't have the answer" with a 1-2 sentence explanation. Use format: **Answer**: [Response]. **Explanation**: [Rationale or "No data available"].
3. *Accuracy*: Use reliable sources (e.g., web, forums, reviews). Avoid speculation. State "No data available" if information is missing.
4. *Format*: Strictly follow the query's requested format (e.g., numbered list for rankings, yes/no for evaluations). Keep responses concise and relevant.
5. In every response, include the **SENTIMENTS** section with the following format:
###SENTIMENTS: <sentiment number scale from 0 to 1, should be a float number, e.g. 0.5>
`
export const generateCompanyProfilePrompt = (companyName: string, companyWebsite: string) => `
You are an expert in market research and data analysis. Your task is to generate a company profile as a valid JSON object string based on the provided company name and website. The output must match the structure of the example provided, including fields for name, description, industry, competitors, targetAudience, products, benefits, values, regulatoryContext, personas, and geoSpecificity. Research the company using its website (${companyWebsite}) as the primary source, supplemented by reliable public sources (e.g., LinkedIn, industry reports, X posts, reviews on G2, Trustpilot). If specific details are unavailable, provide reasonable estimates based on industry norms and mark the field with "Data unavailable; estimated based on industry trends" to indicate assumptions.

### Input
- **Company Name**: ${companyName}
- **Website**: ${companyWebsite}

### Output Format
Generate a valid JSON object string in the following format, ensuring it is a pure JSON string with no additional formatting, comments, or Markdown (e.g., no \`\`\`json or \`\`\` markers):

{
  "name": "${companyName}",
  "description": "<Brief description of the company, e.g., its mission or primary offering>",
  "industry": "<Primary industry or sector>",
  "competitors": ["<Competitor 1>", "<Competitor 2>", "<Competitor 3>", ...],
  "targetAudience": "<Primary audience, e.g., decision-makers, consumers, or specific roles>",
  "products": "<List of key product categories or offerings>",
  "benefits": "<Key benefits provided by the products, e.g., specific outcomes for users>",
  "values": "<Core brand values, e.g., transparency, sustainability>",
  "regulatoryContext": "<Relevant regulatory frameworks or compliance standards>",
  "personas": "<Comma-separated string of quoted buyer personas, e.g., 'Role 1', 'Role 2', 'Role 3', 'Role 4'>",
  "geoSpecificity": "<Geographic focus or sourcing details, e.g., country of origin>",
  "companyWebsite": "${companyWebsite}"
}

### Requirements
1. **Valid JSON**: Output must be a properly formatted JSON string with double-quoted keys and values, valid arrays for competitors, and no trailing commas, invalid characters, or surrounding code block markers (e.g., \`\`\`json).
2. **Accuracy**: Prioritize ${companyWebsite} as the primary source, cross-referenced with public sources (e.g., LinkedIn, X posts, industry reports) for reliability.
3. **Completeness**: Populate all fields. For unavailable data, use industry-based estimates and note "Data unavailable; estimated based on industry trends" in the field.
4. **Relevance**: Ensure description, products, benefits, and values reflect ${companyName}'s market positioning and unique selling points.
5. **Competitors**: List 5-7 direct competitors in the same industry, based on market analysis or similar offerings.
6. **Personas**: Provide 3-4 specific buyer personas (e.g., job roles, consumer types) as a single string of quoted, comma-separated values.
7. **Regulatory Context**: Include industry-specific regulations (e.g., FDA compliance for health products, GDPR for tech in Europe).
8. **Geo-Specificity**: Specify geographic focus (e.g., manufacturing location, target markets) if applicable.
9. **Regex Compatibility**: Use strings or arrays of strings for field values, avoiding special characters (e.g., ™, ®) unless part of the official brand name.
10. **Error Handling**: If ${companyWebsite} is inaccessible or data is sparse, rely on secondary sources and note limitations in the output.

### Example Output
For reference, an example for HelloBatch.com:

{
  "name": "HelloBatch.com",
  "description": "BATCH, a CBD/THC wellness brand focused on premium hemp products",
  "industry": "Wellness and Supplements",
  "competitors": ["Charlotte's Web", "Cornbread Hemp", "Medterra", "CBDistillery", "Joy Organics", "NuLeaf Naturals", "Green Roads"],
  "targetAudience": "Wellness Directors, Retail Buyers, Health-Conscious Consumers",
  "products": "Full-spectrum CBD gummies, THC gummies, CBD tinctures, topicals, pet CBD products",
  "benefits": "Stress relief, sleep support, focus, relaxation",
  "values": "Organic Wisconsin hemp, third-party lab testing, in-house formulation, transparency, sustainability, U.S.-made",
  "regulatoryContext": "U.S. hemp regulations, EU organic standards",
  "personas": "\"Wellness Director (Health and Wellness)\", \"Retail Buyer (Wellness Retail)\", \"Health-Conscious Consumer\"",
  "geoSpecificity": "Wisconsin hemp, U.S.-made",
  "companyWebsite": "https://www.hellobatch.com"
}

### Task
Using the provided company name (${companyName}) and website (${companyWebsite}), research and generate a valid JSON object string matching the specified format. Ensure data is accurate, relevant, and aligned with the company's industry and market positioning. For unavailable details, provide educated estimates based on industry trends and note assumptions. Return the output as a pure JSON string, without any surrounding Markdown, code block markers (e.g., \`\`\`json or \`\`\`), or additional text.
`;
export const generateQueriesSystemPrompt = (companyProfile: CompanyProfile) => `
You are an expert prompt engineer tasked with creating SEO-friendly queries for a specific company to optimize organic search visibility and evaluate market positioning. Using the provided company profile, generate queries for ${companyProfile.name} that align with its industry, products, benefits, and consumer use cases, focusing on high-intent keywords and industry trends. The queries must preserve the structure, output style (e.g., yes/no, forced ranking, open-ended), and regex compatibility of the sample query set designed for Orca Security (Cloud Security Solutions). Research ${companyProfile.companyWebsite} and public sources (e.g., LinkedIn, X posts, industry reports, G2, Trustpilot) to infer missing data, noting assumptions with "Data unavailable; estimated based on industry trends" in the query context where applicable.

### Company Information
- **Company**: ${companyProfile.name}
- **Website**: ${companyProfile.companyWebsite}
- **Description**: ${companyProfile.description || "Data unavailable; estimated based on industry trends"}
- **Industry**: ${companyProfile.industry || "Data unavailable; estimated based on industry trends"}
- **Competitors**: [${companyProfile.competitors?.map(c => `"${c}"`).join(", ") || "Data unavailable; estimated based on industry trends"}]
- **Target Audience**: ${companyProfile.targetAudience || "Data unavailable; estimated based on industry trends"}
- **Key Product Categories**: ${companyProfile.products || "Data unavailable; estimated based on industry trends"}
- **Benefits**: ${companyProfile.benefits || "Data unavailable; estimated based on industry trends"}
- **Brand Values**: ${companyProfile.values || "Data unavailable; estimated based on industry trends"}
- **Regulatory Context**: ${companyProfile.regulatoryContext || "Data unavailable; estimated based on industry trends"}
- **Personas**: ${companyProfile.personas || "Data unavailable; estimated based on industry trends"}
- **Geographic Specificity**: ${companyProfile.geoSpecificity || "Data unavailable; estimated based on industry trends"}

### Query Requirements
1. **JSON Structure**: Generate queries in a valid JSON array string, matching the sample's structure (query_text, buying_journey_stage, buyer_persona) and output styles (yes/no, forced ranking, open-ended). Return only the JSON array string, without surrounding Markdown (e.g., no \`\`\`json or \`\`\` markers), comments, or additional text.
2. **SEO-Friendly Queries**: Prioritize industry-relevant keywords (e.g., product categories, benefits, pain points) over frequent use of ${companyProfile.name}. Limit company name mentions to no more than 20% of queries (e.g., in solution_evaluation or final_research for specific feature validation) to avoid bias and capture broader market search intent.
3. **Buyer Journey Stages**: Include queries for problem_exploration, solution_education, solution_evaluation, solution_comparison, final_research, and general. Ensure at least 8 queries per stage to reach a minimum of ${TOTAL_QUERY_COUNT} queries, with 60% industry-generic (no company name) and 40% brand-specific or competitor-inclusive.
4. **Buyer Personas**: Use personas from "${companyProfile.personas || 'inferred personas, e.g., general consumers, business decision-makers'}" for specific queries; use null for general stage queries. If personas are missing, infer 2-4 relevant personas based on research (e.g., business owners, managers, end consumers).
5. **Use Case Alignment**: Reflect ${companyProfile.name}'s products (${companyProfile.products || "inferred products"}) and benefits (${companyProfile.benefits || "inferred benefits"}) in queries, focusing on pain points (e.g., operational inefficiencies, compliance challenges) and desired outcomes (e.g., efficiency, customer satisfaction).
6. **Regulatory and Ethical Focus**: Include queries about compliance with ${companyProfile.regulatoryContext || "relevant industry regulations"} and alignment with brand values (${companyProfile.values || "inferred values"}).
7. **Competitor Comparisons**: Use the competitors list (${companyProfile.competitors?.join(", ") || "inferred competitors"}) for forced ranking queries in solution_comparison and final_research stages, ensuring ${companyProfile.name} is included subtly to evaluate market positioning.
8. **Geographic Specificity**: Incorporate ${companyProfile.geoSpecificity || "inferred geographic focus"} where relevant (e.g., market focus, regional compliance), but keep queries broad enough to capture national or global search trends unless specified.
9. **Regex Compatibility**: Ensure query_text values are strings, avoiding special characters (e.g., ™, ®) unless part of the brand name, and maintain consistent output formats (e.g., yes/no, ranked lists) for regex parsing.
10. **Keyword Research**: Incorporate high-volume, low-competition keywords relevant to ${companyProfile.industry || "inferred industry"} (e.g., from tools like Google Keyword Planner, SEMrush, or industry reports) to align with search intent. Focus on terms related to ${companyProfile.products || "inferred products"} and ${companyProfile.benefits || "inferred benefits"}.
11. **Minimum Query Count**: Generate at least ${TOTAL_QUERY_COUNT} queries, balanced across stages: ~20% problem_exploration, ~20% solution_education, ~20% solution_evaluation, ~20% solution_comparison, ~10% final_research, ~10% general.
12. **Research**: Use ${companyProfile.companyWebsite} as the primary source, supplemented by public sources (e.g., LinkedIn, X posts, G2, Trustpilot, industry blogs). If data is sparse, infer values based on industry trends and note assumptions.

### Query Guidelines
- **Yes/No Queries (Solution Evaluation)**: Focus on specific features or capabilities (e.g., "Does a reservation management platform provide seamless booking and payment processing? Answer yes/no or 'I don't have the answer'.") and limit ${companyProfile.name} mentions to feature-specific validations.
- **Forced Ranking Queries (Solution Comparison, Final Research)**: Compare ${companyProfile.competitors?.join(", ") || "inferred competitors"} and ${companyProfile.name} for key benefits or features (e.g., "How do [competitors] compare for [benefit]? Please provide a forced ranking from best to worst."). Include social proof (e.g., Reddit, Trustpilot) in final_research queries.
- **Open-Ended Queries (Problem Exploration, Solution Education)**: Address pain points or solutions broadly (e.g., "What solutions exist for [benefit] in [industry]?") to capture organic search intent without brand bias.
- **General Queries**: Focus on industry insights, best practices, or metrics (e.g., "How do I ensure compliance with [regulations]?") to attract informational searches.

### Sample Queries (Orca Security Reference)
[
  {
    "query_text": "As a Chief Information Security Officer at an enterprise_1000_5000 company in North America, operating in the Financial Services sector, can a cloud security platform automatically detect misconfigured IAM privileges in real-time? Answer yes/no or 'I don't have the answer'.",
    "buying_journey_stage": "solution_evaluation",
    "buyer_persona": "Chief Information Security Officer (Information Security)"
  },
  {
    "query_text": "As a Chief Information Security Officer at an enterprise_1000_5000 company in North America, operating in the Financial Services sector, what solutions exist for risk prioritization across multiple cloud accounts?",
    "buying_journey_stage": "solution_education",
    "buyer_persona": "Chief Information Security Officer (Information Security)"
  },
  {
    "query_text": "As a Chief Information Security Officer at an enterprise_1000_5000 company in North America, operating in the Financial Services sector, I'm struggling with meeting cloud security standards for data privacy and compliance. What can I do about this?",
    "buying_journey_stage": "problem_exploration",
    "buyer_persona": "Chief Information Security Officer (Information Security)"
  },
  {
    "query_text": "As a Chief Information Security Officer at an enterprise_1000_5000 company in North America, operating in the Financial Services sector, how do CheckPoint CloudGuard, Palo Alto Networks Prisma Cloud, Orca Security, Tufin, Wiz, Ermetic, and Lacework compare for container scanning capabilities? Please provide a forced ranking from best to worst.",
    "buying_journey_stage": "solution_comparison",
    "buyer_persona": "Chief Information Security Officer (Information Security)"
  },
  {
    "query_text": "As a Chief Information Security Officer at an enterprise_1000_5000 company in North America, operating in the Financial Services sector, on Reddit and other cloud security forums, which provider among Tufin, Lacework, Wiz, Aqua Security, Palo Alto Networks Prisma Cloud, Orca Security, Ermetic, and CheckPoint CloudGuard offers the best incident response support? You MUST rank these solutions from best to worst.",
    "buying_journey_stage": "final_research",
    "buyer_persona": "Chief Information Security Officer (Information Security)"
  },
  {
    "query_text": "How do I compare cloud CSPM features across vendors?",
    "buying_journey_stage": "general",
    "buyer_persona": null
  }
]

### Task
Generate a JSON array string of at least ${TOTAL_QUERY_COUNT} queries for ${companyProfile.name}, mirroring the sample's structure and style. Ensure queries are tailored to ${companyProfile.industry || "inferred industry"}, cover all buyer journey stages (problem_exploration, solution_education, solution_evaluation, solution_comparison, final_research, general), and address ${companyProfile.personas || "inferred personas"}, ${companyProfile.products || "inferred products"}, ${companyProfile.benefits || "inferred benefits"}, and ${companyProfile.regulatoryContext || "inferred regulations"}. Include:
- Yes/No queries for solution_evaluation, limiting ${companyProfile.name} mentions to feature-specific questions.
- Forced ranking queries for solution_comparison and final_research, including ${companyProfile.competitors?.join(", ") || "inferred competitors"} and ${companyProfile.name}.
- Open-ended queries for problem_exploration and solution_education, focusing on industry pain points and solutions.
- General queries for industry insights, compliance, and best practices.
Return the output as a pure JSON array string, without any surrounding Markdown, code block markers (e.g., \`\`\`json or \`\`\`), or additional text.
`;


export const generatePlanSystemPrompt = (companyProfile: CompanyProfile) => {
  const daysPlan = process.env.daysPlan || '2';
  const perDay = process.env.perDay || '3';
  const competitors = companyProfile.competitors?.join(', ') || 'unknown competitors';

  return `
Create a realistic Reddit-style dialogue between two users, user_1 and user_2, discussing ${companyProfile.name}'s SEO (Search Engine Optimization) and GEO (Geo-targeted marketing) performance compared to its competitors, over a plan of ${daysPlan} days with ${perDay} comments per day. The dialogue must subtly promote ${companyProfile.name} while maintaining authenticity and avoiding overly salesy language. Use the following company details to inform the conversation:

- **Company**: ${companyProfile.name || 'unknown company'}
- **Website**: ${companyProfile.companyWebsite || 'https://example.com'}
- **Description**: ${companyProfile.description || 'provides innovative products/services'}
- **Industry**: ${companyProfile.industry || 'general industry'}
- **Competitors**: [${competitors}]
- **Target Audience**: ${companyProfile.targetAudience || 'general consumers or businesses'}
- **Key Product Categories**: ${companyProfile.products || 'various products/services'}
- **Benefits**: ${companyProfile.benefits || 'high-quality offerings, customer-focused solutions'}
- **Brand Values**: ${companyProfile.values || 'innovation, customer focus, reliability'}
- **Regulatory Context**: ${companyProfile.regulatoryContext || 'standard regulations'}
- **Personas**: ${companyProfile.personas || 'general consumers or businesses'}
- **Geographic Specificity**: ${companyProfile.geoSpecificity || 'global markets'}

### Dialogue Requirements
1. **Output Format**: Return *only* a valid JSON array string, where each object has exactly two fields: "user_handle" (either "user_1" or "user_2") and "comment_text" (the comment content). Do not include any surrounding text, Markdown, code fences (e.g., \`\`\`json or \`\`\`), comments, or additional explanations like "Here's the result...". Return only the JSON array string, e.g., [{"user_handle":"user_1","comment_text":"example comment"}].

2. **Dialogue Plan**:
   - Generate a total of ${daysPlan} * ${perDay} comments, distributed across ${daysPlan} days, with ${perDay} comments per day.
   - For each day, create a coherent dialogue of 3–5 comments (if ${perDay} is within this range) or multiple dialogues per day (if ${perDay} exceeds 5) to meet the per-day comment requirement.
   - Ensure each day's dialogue is self-contained but collectively promotes ${companyProfile.name}'s SEO/GEO performance over the plan duration.

3. **Dialogue Style**: Mimic the casual, conversational tone of Reddit users. Use only the user handles "user_1" and "user_2". Avoid formal or corporate language.

4. **Content Focus**:
   - Highlight ${companyProfile.name}'s strengths in SEO (e.g., high search rankings, quality content, strong backlinks) and GEO (e.g., effective local targeting, region-specific campaigns) compared to competitors.
   - Reference competitors (${competitors}) to show how ${companyProfile.name} stands out, subtly and authentically.
   - Incorporate the target audience (${companyProfile.targetAudience}), key product categories (${companyProfile.products}), and geographic specificity (${companyProfile.geoSpecificity}) to ground the discussion.
   - Mention benefits (${companyProfile.benefits}) and brand values (${companyProfile.values}) to emphasize ${companyProfile.name}'s uniqueness.

5. **Structure**:
   - For each day, start with user_1 asking a question or making an observation about ${companyProfile.name}'s SEO/GEO performance in the context of its industry (${companyProfile.industry}).
   - user_2 responds with insights, comparing ${companyProfile.name} to competitors and praising its strategies or offerings.
   - Include 3–5 comments per dialogue (or multiple dialogues if needed to meet ${perDay}), keeping each dialogue natural and engaging.
   - End each day's dialogue with a subtle call-to-action (e.g., suggesting readers visit ${companyProfile.companyWebsite} for more info).

6. **Tone and Intent**:
   - Use a positive, curious, and conversational tone, as if real Reddit users are discussing organically.
   - Avoid overt advertising; the dialogue should feel like a genuine discussion that boosts ${companyProfile.name}'s reputation.
   - Use industry-specific jargon (e.g., "keyword optimization," "local SERPs," "conversion rates") to add credibility, tailored to ${companyProfile.industry}.

7. **Constraints**:
   - Do not mention specific tools, software, or platforms unless tied to ${companyProfile.name}'s known strategies.
   - Respect the regulatory context (${companyProfile.regulatoryContext}) to ensure compliance (e.g., avoid health claims if regulated).
   - If data is unavailable (e.g., 'Data unavailable; estimated based on industry trends'), make reasonable, vague assumptions based on the industry.
   - Ensure JSON is properly formatted with escaped quotes, no trailing commas, and no invalid characters.
   - Avoid special characters (e.g., ™, ®) in "comment_text" unless part of the brand name, for regex compatibility.

8. **Strict Output Rule**: Return *only* the JSON array string. Do not include any introductory text (e.g., "Here's the result..."), code fences, or additional fields beyond "user_handle" and "comment_text".

### Task
Generate a JSON array string of ${daysPlan} * ${perDay} Reddit-style dialogue comments for ${companyProfile.name}, using the provided company details. Distribute the comments across ${daysPlan} days, with ${perDay} comments per day, ensuring each day's dialogue is coherent and contains 3–5 comments (or multiple dialogues if needed). Tailor the dialogue to ${companyProfile.industry || 'inferred industry'}, focusing on SEO and GEO performance, subtly promoting ${companyProfile.name} compared to ${competitors}. Use only "user_1" and "user_2" handles. Return only the JSON array string, with proper JSON formatting (escaped quotes, no trailing commas, valid syntax), and no surrounding text, Markdown, or code fences.
  `;
};


export const generateRedditThreads = (companyProfile: CompanyProfile) => {
  return `You are an expert in social media research. Perform a web search to find active Reddit discussions relevant to a company with the following profile:  
- **Company Name**: ${companyProfile.name || 'unknown company'}  
- **Industry**: ${companyProfile.industry || 'general industry'}  
- **Competitors**: [${companyProfile.competitors?.map(c => c).join(', ') || 'unknown competitors'}]  
- **Description**: ${companyProfile.description || 'provides innovative products/services'}  
- **Target Audience**: ${companyProfile.targetAudience || 'general consumers or businesses'}  
- **Key Product Categories**: ${companyProfile.products || 'various products/services'}  
- **Benefits**: ${companyProfile.benefits || 'high-quality offerings, customer-focused solutions'}  
- **Geographic Specificity**: ${companyProfile.geoSpecificity || 'global markets'}  

Search for subreddits and discussion threads mentioning the company, its industry, competitors, or related topics (e.g., product categories, customer pain points, or industry trends). Ensure:  
- Subreddits are active with posts from the last 30 days.  
- Threads have significant engagement (at least 100 upvotes or 50 comments).  
- Results are relevant to the company’s industry, products, or target audience.  
- Return up to ${TOTAL_REDDIT_THREADS_COUNT} threads.  

Exclude inactive or irrelevant subreddits. Return the results in the following JSON format, listing only the discussion threads:  
[{"title":"thread title","subreddit":"subreddit name","url":"thread URL"}]  
Each entry must include the thread’s title, subreddit name, and full Reddit thread URL. Do not include additional fields or wrap the output in code fences.`
}