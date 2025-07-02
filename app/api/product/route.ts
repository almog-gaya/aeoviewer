import { PRODUCT_INPUT } from '@/lib/ProductInput';
import { InsightQuery } from '@/types/InsightQuery';
import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';

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