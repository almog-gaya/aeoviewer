import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const PDF_PAGE_WIDTH = 1200; // px
const PDF_PAGE_HEIGHT = 2511; // px
const DASHBOARD_WIDTH = 1000; // px

export async function POST(req: Request) {
  try {
    let { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }
    // Always append ?report=1 or &report=1
    url += url.includes('?') ? '&report=1' : '?report=1';

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    // Wait for .report-mode to be present on body
    await page.waitForFunction(() => document.body.classList.contains('report-mode'));

    // Set dashboard root width to 1000px and center it, remove flex/centering from body
    await page.evaluate((dashboardWidth) => {
      const dashboard = document.querySelector('[data-dashboard-root]');
      if (dashboard) {
        const el = dashboard as HTMLElement;
        el.style.width = dashboardWidth + 'px';
        el.style.margin = '0 auto';
        el.style.display = '';
        el.style.flexDirection = '';
        el.style.alignItems = '';
      }
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100%';
      document.body.style.display = '';
      document.body.style.justifyContent = '';
    }, DASHBOARD_WIDTH);
  
    const pdfBuffer = await page.pdf({
      width: PDF_PAGE_WIDTH + 'px',
      height: PDF_PAGE_HEIGHT + 'px',
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 