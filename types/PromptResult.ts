export interface PromptResult {
    company_name: string;
    query_text: string;
    response_text: string;
    buyer_persona?: string;
    buying_journey_stage?: string;
    solution_analysis?: any;
    ranking_position?: number | null;
    sentiment_score?: number | null;
    recommended?: boolean;
    rank_list?: string;
    answer_engine?: string;
    company_mentioned?: boolean;
    mentioned_companies?: string[];
    competitors_list?: string[];
    citation?: Citation[]
};

export interface Citation {
    title: string,
    url: string,
    start_index: number,
    end_index: number,
    type: string,
}