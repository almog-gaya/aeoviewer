import OpenAI from 'openai';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { Citation, PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig, TaskType } from './base';
import { DialogueTurn } from '@/types/Planner';
import fs from 'fs/promises';
import { RedditThread } from '@/types/RedditThread';
import { ResponseOutputItem } from 'openai/resources/responses/responses.mjs';
export class OpenAIProvider extends BaseLLMProvider {
    private openai: OpenAI;

    constructor(config: LLMConfig) {
        super(config);
        this.openai = new OpenAI({
            apiKey: config.apiKey
        });
        console.log(`OpenAI Provider initialized with ${this.getModelInfo()}`);
    }
    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            console.log(`OpenAI: Generating response text using ${this.getModelInfo()}`);

            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage,
                input.buyer_persona ?? 'null'
            );

            const response = await this.openai.responses.create({
                model: this.config.model || 'gpt-4o',
                tools: [{
                    type: "web_search_preview",
                }],
                tool_choice: "auto",
                temperature: this.config.temperature || 0.7,
                input: `###User: ${input.query_text}, \n\n\ ###System Prompt: ${systemPrompt}`,
            });



            return {
                ...company,
                answer_engine: 'chatgpt',
                company_name: company.name,
                query_text: input.query_text,
                response_text: response.output_text,
                buyer_persona: input.buyer_persona || undefined,
                buying_journey_stage: input.buying_journey_stage || undefined,
                citation: this._getCitations(response),
            };
        } catch (error) {
            this.handleError(error, 'generate response text');
        }
    }

    async generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile> {
        try {
            console.log(`OpenAI: Generating company profile using ${this.getModelInfo()}`);

            const systemPrompt = prompt.generateCompanyProfilePrompt(companyName, companyWebsite);

            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a company profile for ${companyName} with website ${companyWebsite}` }
                ],
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.3,
            });

            const responseText = completion.choices?.[0]?.message?.content || '';
            const profile = this.parseJSONResponse(responseText, {
                name: companyName,
                companyWebsite: companyWebsite,
            });

            return profile;
        } catch (error) {
            console.error('Error parsing company profile JSON:', error);
            return {
                name: companyName,
                companyWebsite: companyWebsite,
            };
        }
    }

    async generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]> {
        try {
            console.log(`OpenAI: Generating queries using ${this.getModelInfo()}`);

            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);

            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate queries for the company profile of ${companyProfile.name}` }
                ],
                // max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
            });

            const responseText = completion.choices?.[0]?.message?.content || '';
            console.info(`Generated queries using ${this.getModelInfo()}: ${responseText.substring(0, 200)}...`);

            console.info(`Generated queries: ${responseText}`);
            fs.writeFile(
                "rawResponseString.txt",
                responseText,
                'utf-8'
            );
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }

    async generatePlan(companyProfile: CompanyProfile): Promise<DialogueTurn[]> {
        try {
            console.log(`OpenAI: Generating plan using ${this.getModelInfo()}`);

            const systemPrompt = prompt.generatePlanSystemPrompt(companyProfile);

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a plan for the company profile of ${companyProfile.name} that is engaging and more Search Engine Optimized` }
                ],
                // max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
            });

            const responseText = completion.choices?.[0]?.message?.content || '';
            fs.writeFile(
                "rawResponseString.txt",
                responseText,
                'utf-8'
            );
            console.info(`Generated plan using ${this.getModelInfo()}: ${responseText.substring(0, 200)}...`);

            const plan = this.parseJSONResponse(responseText, {});
            return plan;
        } catch (error) {
            console.error('Error parsing generated plan JSON:', error);
            return [];
        }
    }


    async generateRedditThreads(companyProfile: CompanyProfile): Promise<RedditThread[]> {
        try {
            console.log(`OpenAI: Generating Reddit threads using ${this.getModelInfo()}`);

            const systemPrompt = prompt.generateRedditThreads(companyProfile);

            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate Reddit threads for the company profile of ${companyProfile.name}` }
                ],
                // max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
            });


            const responseText = completion.choices?.[0]?.message?.content || '';

            console.info(`🔥🔥🔥🔥🔥`)
            console.info(`Generated Reddit threads using ${this.getModelInfo()}: ${responseText}`);
            console.info(`🔥🔥🔥🔥🔥`)
            const threads = this.parseJSONResponse(responseText, []);
            return threads as RedditThread[];
        } catch (error) {
            console.error('Error parsing generated Reddit threads JSON:', error);
            return [];
        }
    }

    async generateRawResponse(prompt: any, systemPrompt: string): Promise<any> {
        try {
            console.log(`Gemini: Generating Reddit threads using ${this.getModelInfo()}`);

            const response = await this.openai.responses.create({
                model: "o4-mini",
                tools: [{ type: "web_search_preview" }],
                tool_choice: "auto",
                input: `###User: ${prompt}, \n\n\ ###System Prompt: ${systemPrompt}`,
            });

            return this._getCitations(response);
        } catch (error) {
            console.error('Error extracting citations:', error);
            return [];
        }
    }

    _getCitations(response: OpenAI.Responses.Response): Citation[] {
        try {
            const messageOutput = response.output.find((o: any) => o.type === "message");
            if (!messageOutput) return [];

            const content = ((messageOutput as any).content)?.find((c: any) => c.type === "output_text");
            if (!content?.annotations) return [];

            return content.annotations;
        } catch (_) {
            return [];
        }
    }
} 