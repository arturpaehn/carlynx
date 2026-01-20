'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/components/I18nProvider';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  author: string;
  category: string;
  tags: string[];
  internal_links: string[];
  published_at: string;
  view_count: number;
}

export default function BlogPostPage() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data);
        
        // Update SEO
        document.title = `${data.title} | CarLynx Blog`;
      } catch (err) {
        setError('Article not found');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link href="/blog" className="text-orange-500 hover:text-orange-600 font-semibold">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-24 pb-16">
      <article className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/blog" className="text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-2 mb-4">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 items-center text-gray-600 mb-6 pb-6 border-b border-gray-200">
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {post.author}
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {post.view_count} views
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="relative h-96 w-full mb-8 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-8 text-gray-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Internal Links Section */}
        {post.internal_links && post.internal_links.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Related Pages:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {post.internal_links.map((link, idx) => (
                <Link
                  key={idx}
                  href={link}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 group"
                >
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {link.replace(/\//g, ' / ').replace('-', ' ')}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?category=${tag}`}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-orange-500 hover:text-white transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to buy or sell a vehicle?</h3>
          <p className="mb-4">Browse thousands of listings across Texas</p>
          <Link
            href="/search-results"
            className="inline-block px-6 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-gray-100 transition-all"
          >
            Browse Vehicles
          </Link>
        </div>
      </article>
    </div>
  );
}
