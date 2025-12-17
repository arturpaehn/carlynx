import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Fetch all regular listings (active and inactive)
    const { data: allListings, error: err1 } = await supabaseAdmin
      .from('listings')
      .select('id, is_active, created_at');

    // Fetch all external listings (active and inactive)
    const { data: allExternalListings, error: err2 } = await supabaseAdmin
      .from('external_listings')
      .select('id, is_active, created_at');

    if (err1 || err2) {
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    const regularListings = allListings || [];
    const externalListings = allExternalListings || [];

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count totals
    const regularTotal = regularListings.length;
    const regularActive = regularListings.filter((l: any) => l.is_active).length;
    const externalTotal = externalListings.length;
    const externalActive = externalListings.filter((l: any) => l.is_active).length;

    const total = regularTotal + externalTotal;
    const active = regularActive + externalActive;
    const inactive = total - active;

    const last30count =
      regularListings.filter((l: any) => l.created_at && new Date(l.created_at) >= last30).length +
      externalListings.filter((l: any) => l.created_at && new Date(l.created_at) >= last30).length;

    const todayCount =
      regularListings.filter((l: any) => l.created_at && l.created_at.slice(0, 10) === todayStr).length +
      externalListings.filter((l: any) => l.created_at && l.created_at.slice(0, 10) === todayStr).length;

    // Calculate monthly data
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    const monthly = months.map(({ year, month }) => {
      const regularCount = regularListings.filter((l: any) => {
        if (!l.created_at) return false;
        const dt = new Date(l.created_at);
        return dt.getFullYear() === year && dt.getMonth() === month;
      }).length;

      const externalCount = externalListings.filter((l: any) => {
        if (!l.created_at) return false;
        const dt = new Date(l.created_at);
        return dt.getFullYear() === year && dt.getMonth() === month;
      }).length;

      return regularCount + externalCount;
    });

    return NextResponse.json({
      stats: { total, active, inactive, last30: last30count, today: todayCount },
      monthly,
      regularListings,
      externalListings,
    });
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
