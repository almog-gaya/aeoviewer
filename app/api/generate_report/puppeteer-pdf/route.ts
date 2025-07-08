import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const PDF_PAGE_WIDTH = 1200; // px
const PDF_PAGE_HEIGHT = 2511; // px
const DASHBOARD_WIDTH = 1000; // px

export async function POST(req: Request) {
  try {
    let { url, type } = await req.json();
    const isReddit = type === 'reddit';
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }
    // Always append ?report=1 or &report=1
    url += url.includes('?') ? '&report=1' : '?report=1';

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: PDF_PAGE_WIDTH, height: 1000 }); // Initial viewport
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
    // Wait for .report-mode to be present on body
    await page.waitForFunction(() => document.body.classList.contains('report-mode'));

    // Inject basic CSS to ensure content renders if no styles are loaded
    await page.addStyleTag({
      content: `
        body { margin: 0; padding: 0; width: 100%; }
        [data-dashboard-root] { width: 1000px; margin: 0 auto; display: block; }
        .report-content { display: block; overflow: visible; }
      `
    });

    // Set dashboard root width to 1000px and center it, remove flex/centering from body
    await page.evaluate((dashboardWidth) => {
      const dashboard = document.querySelector('[data-dashboard-root]');
      if (dashboard) {
        const el = dashboard as HTMLElement;
        el.style.width = dashboardWidth + 'px';
        el.style.margin = '0 auto';
        el.style.display = 'block';
        el.style.flexDirection = '';
        el.style.alignItems = '';
      }
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100%';
      document.body.style.display = 'block';
      document.body.style.justifyContent = '';
    }, DASHBOARD_WIDTH);

    // Calculate dynamic height for Reddit, use hardcoded height for others
    let pdfHeight = PDF_PAGE_HEIGHT;
    if (isReddit) {
      const contentHeight = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return new Promise((resolve) => setTimeout(() => {
          const content = document.querySelector('.report-content');
          if (content) {
            const { height: contentHeight } = content.getBoundingClientRect();
            const totalHeight = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight
            );
            console.log(`Content Height: ${contentHeight}px`);
            console.log(`Total Height: ${totalHeight}px`);
            const excess = totalHeight - contentHeight;
            console.log(`Excess: ${excess}px`);
            const adjustedHeight = excess > 0 ? contentHeight + (excess * 0.5) : contentHeight;
            console.log(`Adjusted Height: ${adjustedHeight}px`);
            resolve(adjustedHeight);
          }
          const height = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          );
          console.log(`Fallback Height: ${height}px`);
          resolve(height);
        }, 500));
      }) as number;
      pdfHeight = contentHeight > 0 ? contentHeight : PDF_PAGE_HEIGHT;
      console.log(`Final PDF Height: ${pdfHeight}px`);
    }

    // Set the viewport to the content width and calculated height
    await page.setViewport({
      width: PDF_PAGE_WIDTH,
      height: pdfHeight,
    });

    const pdfBuffer = await page.pdf({
      width: PDF_PAGE_WIDTH + 'px',
      height: pdfHeight + 'px',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
      pageRanges: '1',
      preferCSSPageSize: true,
    });
    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="dashboard-report.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}