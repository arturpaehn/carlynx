'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import { useTranslation } from '@/components/I18nProvider';

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

export default function BlogPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState(searchParams?.get('category') || '');

  const categories = [
    { id: '', label: 'All Articles' },
    { id: 'buying-guide', label: 'Buying Guides' },
    { id: 'selling-guide', label: 'Selling Guides' },
    { id: 'vin-check', label: 'VIN Check' },
    { id: 'local-houston', label: 'Houston' },
    { id: 'local-dallas', label: 'Dallas' },
    { id: 'local-austin', label: 'Austin' },
    { id: 'local-katy', label: 'Katy' },
    { id: 'finance', label: 'Finance' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (category) {
          params.append('category', category);
        }

        const response = await fetch(`/api/blog?${params}`);
        const data = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            CarLynx Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your guide to buying, selling, and maintaining vehicles in Texas. Expert tips, market insights, and everything you need to know about used cars and motorcycles.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                category === cat.id
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        page === p
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No articles found yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
