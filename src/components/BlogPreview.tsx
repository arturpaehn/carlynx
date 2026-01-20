import Link from 'next/link';
import BlogCard from '@/components/BlogCard';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url?: string;
  category: string;
  published_at: string;
  view_count: number;
}

export default async function BlogPreview() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.carlynx.us'}/api/blog?page=1&limit=3`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch blog posts:', response.status);
      return null;
    }

    const data = await response.json();
    const posts: BlogPost[] = Array.isArray(data.posts) ? data.posts : [];

    if (posts.length === 0) {
      return null;
    }

    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Latest Blog Posts
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Expert guides on buying, selling, and maintaining vehicles in Texas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/blog"
              className="inline-block px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all"
            >
              Read All Articles →
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading blog preview:', error);
    return null;
  }
}
