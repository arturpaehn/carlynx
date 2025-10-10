import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { listingId, isExternal } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    // Используем service_role_key чтобы обойти RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (isExternal) {
      // Инкремент для external_listings
      const { data, error } = await supabaseAdmin
        .from('external_listings')
        .select('views')
        .eq('id', listingId)
        .single();

      if (error) {
        console.error('Error fetching external listing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const newViews = (data.views || 0) + 1;

      const { error: updateError } = await supabaseAdmin
        .from('external_listings')
        .update({ views: newViews })
        .eq('id', listingId);

      if (updateError) {
        console.error('Error updating external listing views:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, newViews });
    } else {
      // Инкремент для listings
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('views')
        .eq('id', listingId)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const newViews = (data.views || 0) + 1;

      const { error: updateError } = await supabaseAdmin
        .from('listings')
        .update({ views: newViews })
        .eq('id', listingId);

      if (updateError) {
        console.error('Error updating listing views:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, newViews });
    }
  } catch (error) {
    console.error('Error in increment-views API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
