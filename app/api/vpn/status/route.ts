import { NextRequest, NextResponse } from 'next/server';
import { getVPNStatus, testVPNConnectivity } from '@/lib/providers/factory';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testConnectivity = url.searchParams.get('test') === 'true';

    // Get basic VPN status
    const status = await getVPNStatus();

    // Optionally test connectivity
    let connectivityTest = {};
    if (testConnectivity) {
      connectivityTest = await testVPNConnectivity();
    }

    return NextResponse.json({
      ...status,
      connectivityTest: testConnectivity ? connectivityTest : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting VPN status:', error);
    return NextResponse.json(
      { error: 'Failed to get VPN status', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'test_connectivity') {
      const results = await testVPNConnectivity();
      return NextResponse.json({ results });
    }

    if (action === 'get_region_stats') {
      const { regionManager } = await import('@/lib/vpn/region-manager');
      const stats = regionManager.getRegionStats();
      return NextResponse.json({ stats });
    }

    if (action === 'health_check') {
      const { regionManager } = await import('@/lib/vpn/region-manager');
      const healthResults = await regionManager.runHealthChecks();
      return NextResponse.json({ healthResults });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing VPN action:', error);
    return NextResponse.json(
      { error: 'Failed to process VPN action', details: String(error) },
      { status: 500 }
    );
  }
} 