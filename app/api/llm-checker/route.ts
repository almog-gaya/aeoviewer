import { NextResponse } from 'next/server';

export async function GET(req: Request) {

    const url = new URL(req.url);
    const llmURL = url.searchParams.get('url') || '';

    if (!llmURL) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const res = await getLLMTxt(llmURL);
    if (!res) {
        return NextResponse.json({ exists: false, content: '' });
    }
    const exists = res.exists;
    const robotsContent = res.content;
    return NextResponse.json({ exists: exists, content: robotsContent });
}

export async function POST(req: Request) {
    const url = new URL(req.url);
    const robotsURL = url.searchParams.get('url') || '';

    if (!robotsURL) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // Fetch robots.txt
        const robotsResponse = await fetch(robotsURL);

        if (!robotsResponse.ok) {
            return NextResponse.json(
                { error: `Failed to fetch robots.txt: ${robotsResponse.statusText}` },
                { status: robotsResponse.status }
            );
        }

        console.log(`URL : ${JSON.stringify(robotsResponse)}`)

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



export const getLLMTxt = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch LLM URL: ${response.statusText}`);
            return {
                exists: false,
                content: ''
            }
        }
        const content = await response.text();
        return {
            exists: content.trim().length > 0,
            content: content
        }
    } catch (error) {
        console.error(`Error checking LLM URL: ${error}`);
        return {
            exists: false,
            content: ''
        }
    }
}