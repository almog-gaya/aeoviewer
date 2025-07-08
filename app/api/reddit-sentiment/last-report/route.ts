import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: Request) {

    //  Load the file from prompts.json in root of this directory
    const prompts = JSON.parse(fs.readFileSync('finalized_output_reddit_sentiment_report.json', 'utf8'));

    return NextResponse.json(prompts);

}