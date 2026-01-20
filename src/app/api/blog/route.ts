import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, featured_image_url, category, published_at, view_count', {
        count: 'exact',
      })
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ posts: [], total: 0, page, totalPages: 0, error: error.message }, { status: 200 });
    }

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in blog API:', error);
    return NextResponse.json({ posts: [], total: 0, page: 1, totalPages: 0, error: 'Internal server error' }, { status: 200 });
  }
}
