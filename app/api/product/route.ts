import { InsightQuery } from '@/types/InsightQuery';
import { NextResponse } from 'next/server';


const PRODUCT_INPUT: InsightQuery[] = [
    {
        "query_text": "What are the key trends in cosmetic manufacturing that address sustainability and compliance for beauty brands?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What are the primary capabilities to look for in a cosmetic manufacturing partner for scalability and innovation?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "How do cosmetic manufacturers like Batch Laboratories, Voyant Beauty, and others compare in terms of industry reputation for quality and speed?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What metrics should I track to evaluate the efficiency of a cosmetic manufacturing process?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "How can I ensure compliance with global cosmetic regulations like EU 1223/2009 and FDA requirements?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What are the best practices for managing supply chain risks in cosmetic manufacturing?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What technologies are shaping the future of cosmetic production for large-scale enterprises?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "How do leading cosmetic manufacturers balance cost efficiency with high-quality production?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What are the emerging consumer demands influencing cosmetic manufacturing processes?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "What are the key challenges in achieving scalability in cosmetic manufacturing for beauty brands?",
        "buying_journey_stage": "general",
        "buyer_persona": null
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm concerned about ensuring our upcoming cosmetic regulation audit goes smoothly. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm worried about supply chain disruptions impacting our cosmetic product launches. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm struggling with meeting various cosmetic regulatory standards for global markets. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, we're experiencing an alarming increase in production delays, but most lack clear root causes, causing frustration among my team. Our current systems generate vague error reports with no clear way to identify supply chain bottlenecks. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm increasingly concerned about our supply chain’s visibility gaps across multiple vendors. Production delays keep me up at night, and we've already had two minor disruptions this quarter. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I'm concerned that our current manufacturing partner gives us limited visibility into supply chain risks that could lead to compliance issues. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I'm increasingly worried about our ability to ensure quality in small-batch and custom cosmetic production where traditional manufacturing processes fall short. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm noticing increasing gaps in our raw material inventory. Untracked supplier shipments often go undetected until they become production issues. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm worried about rapidly evolving regulatory requirements impacting our cosmetic production. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, my team is overwhelmed with manual compliance checks and production delays across multiple product lines. What can I do about this?",
        "buying_journey_stage": "problem_exploration",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, what solutions exist in the cosmetic manufacturing market for streamlining production across multiple product lines?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, what solutions exist in the cosmetic manufacturing market for real-time quality control across production batches?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, what solutions exist in the cosmetic manufacturing market for low minimum order quantities for indie brands?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm exploring solutions that can help us achieve continuous compliance monitoring for cosmetic regulations. What tools exist that can map production processes to regulations like EU 1223/2009 and FDA with minimal manual effort?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm researching unified cosmetic manufacturing platforms that can replace our current patchwork of point solutions. What comprehensive tools can integrate formulation, compliance, and production tracking across multiple product lines?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I'm looking for cosmetic manufacturing platforms that can handle both formulation and packaging. What solutions exist that provide this comprehensive coverage?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I need to research comprehensive cosmetic manufacturing solutions that work across multiple product categories. What solutions exist that can provide unified production and compliance?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, what solutions exist for automating quality assurance in cosmetic manufacturing to reduce defect rates?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, what tools can help optimize inventory management for cosmetic raw materials to prevent production delays?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, what solutions exist for integrating sustainable packaging into cosmetic manufacturing processes?",
        "buying_journey_stage": "solution_education",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, can Batch Laboratories automatically scale production to meet fluctuating demand for skincare products? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, does Batch Laboratories offer customizable packaging solutions that align with our brand’s sustainability goals? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, can Batch Laboratories handle small-batch production for limited-edition cosmetic products without compromising quality? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, does Batch Laboratories automatically map supply chain processes to cosmetic compliance frameworks like EU 1223/2009 and FDA without manual intervention? Answer yes/no or 'I don't have the answer.'",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, can Batch Laboratories ensure consistent quality in custom formulations without requiring extensive manual testing? Answer yes/no or 'I don't have the answer.'",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, can Batch Laboratories provide real-time tracking of raw material sourcing to ensure compliance with EU cosmetic regulations? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, does Batch Laboratories provide continuous compliance monitoring for cosmetic regulations like EU 1223/2009 and FDA requirements with automated reporting? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, does Batch Laboratories integrate with existing ERP systems to streamline production planning and compliance tracking? Answer yes/no or 'I don't have the answer.'",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, does Batch Laboratories incorporate advanced quality control systems for ensuring batch consistency in cosmetic production? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, can Batch Laboratories handle production of vegan and cruelty-free cosmetics without additional certifications? Answer yes/no or 'I don't have the answer'.",
        "buying_journey_stage": "solution_evaluation",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, how do Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare for custom formulation capabilities? Please provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, how do Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare in terms of speed to market for new skincare product launches? Please provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, how do Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare in providing compliance coverage for cosmetic regulations? Please provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I need to compare the scalability approaches of Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA. Which provides the most flexible production capacity for DTC beauty brands? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm comparing the production capabilities of Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA for small-batch cosmetics. Which offers the most reliable quality control? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I need to understand how Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare specifically for compliance with global cosmetic regulations. You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I'm comparing Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA for cosmetic manufacturing capabilities. You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I'm evaluating Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA for our cosmetic manufacturing needs. Which provides the best scalability and lowest operational overhead? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, how do Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare in terms of real-time supply chain visibility? Please provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, I need to compare the integration capabilities with supply chain systems between Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA. You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "solution_comparison",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, on LinkedIn and beauty industry forums, which provider among Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA offers the best support for DTC brand launches? You MUST rank these solutions from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, on LinkedIn and beauty industry forums, which among Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA is known for minimal production delays? You MUST rank these solutions from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, on LinkedIn and beauty industry forums, which among Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA is most recommended for compliance automation? You MUST rank these solutions from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, according to LinkedIn and beauty community discussions, which platform among Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA has the fastest production time and quickest time to market for beauty brands? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I've seen discussions on LinkedIn comparing Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA for beauty brands. Based on actual user feedback and documented capabilities, which provides the most comprehensive production with the least operational overhead? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, what do beauty industry professionals on LinkedIn and industry forums say about their experiences with Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, based on G2 and industry reviews, how do Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA compare for customer support and responsiveness? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (general)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, I've been researching analyst reports and customer reviews on G2 comparing Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA. Which platform has the highest ratings for production accuracy and lowest defect rates? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a VP of Supply Chain at an enterprise_1000_5000 company in North America, operating in the Consumer Goods sector, based on case studies and industry forum discussions, which platform among Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA delivers the strongest ROI for beauty brands through reduction in production delays and operational overhead? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "VP of Supply Chain (Operations)"
    },
    {
        "query_text": "As a Chief Operations Officer at an enterprise_1000_plus company in Europe, operating in the Beauty sector, what do customer reviews and industry forums say about the defect rates of Batch Laboratories, Voyant Beauty, Dynamic Blending, Mana Products, Seed Beauty, and Kolmar USA? You MUST provide a forced ranking from best to worst.",
        "buying_journey_stage": "user_feedback",
        "buyer_persona": "Chief Operations Officer (general)"
    }
]

/**
 *  Fetches the product input (seeds)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const isGeneral = searchParams.get('isGeneralBuyingJourney');

    let filteredInput;

    if (isGeneral === 'true') {
        filteredInput = PRODUCT_INPUT.filter(input => input.buying_journey_stage === 'general');
    } else if (isGeneral === null) {
        filteredInput = PRODUCT_INPUT;
    } else {
        filteredInput = PRODUCT_INPUT.filter(input => input.buying_journey_stage !== 'general');
    }

    return NextResponse.json(filteredInput);
}