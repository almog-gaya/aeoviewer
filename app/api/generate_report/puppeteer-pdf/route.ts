import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const PDF_PAGE_WIDTH = 1200; // px
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

    // Force body to use flexbox and center dashboard
    await page.evaluate((dashboardWidth) => {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100%';
      document.body.style.display = 'flex';
      document.body.style.justifyContent = 'center';
      const dashboard = document.querySelector('[data-dashboard-root]');
      if (dashboard) {
        const el = dashboard as HTMLElement;
        el.style.width = dashboardWidth + 'px';
        el.style.margin = '0';
        el.style.paddingLeft = '0';
        el.style.marginLeft = '0';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
      }
    }, DASHBOARD_WIDTH);

    // Get the scrollHeight of the dashboard content
    const dashboardHeight = await page.evaluate(() => {
      const dashboard = document.querySelector('[data-dashboard-root]');
      return dashboard ? dashboard.scrollHeight : document.body.scrollHeight;
    });

    const pdfBuffer = await page.pdf({
      width: PDF_PAGE_WIDTH + 'px',
      height: (dashboardHeight - 1350) + 'px',
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