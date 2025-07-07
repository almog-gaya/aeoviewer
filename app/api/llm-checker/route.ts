import { NextResponse } from 'next/server';

export async function GET(req: Request) {

    const url = new URL(req.url);
    const llmURL = url.searchParams.get('url') || '';

    if (!llmURL) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const res = await fetch(llmURL, { method: "HEAD" });
    console.log(`LLM URL Response: ${res.status} ${res.statusText} for ${llmURL}`);

    return NextResponse.json({ exists: res.ok });
}

export async function POST(req: Request) {
    const url = new URL(req.url);
    const robotsURL = url.searchParams.get('url') || '';

    if (!robotsURL) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try { 
        

        // Fetch robots.txt
        const robotsResponse = await fetch(robotsURL, { method: 'HEAD' });
        
        if (!robotsResponse.ok) {
            return NextResponse.json(
                { error: `Failed to fetch robots.txt: ${robotsResponse.statusText}` },
                { status: robotsResponse.status }
            );
        }

        // Get the robots.txt content
        const robotsContent = await robotsResponse.text();

        // Generate llm.txt content (copying robots.txt content as per request)
        const llmContent = `# llm.txt\n# Generated based on robots.txt from ${robotsURL}\n${robotsContent}`;

        // Return the generated llm.txt content
        return NextResponse.json({
            exists: true,
            llmContent: llmContent
        });
    } catch (error) {
        console.error(`Error fetching LLM URL: ${error}`);
        return NextResponse.json({ error: 'Failed to check LLM URL' }, { status: 500 });
    }
}