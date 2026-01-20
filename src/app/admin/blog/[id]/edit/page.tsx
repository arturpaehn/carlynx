'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  author: string;
  category: string;
  tags: string[];
  seo_keywords: string[];
  internal_links: string[];
  is_published: boolean;
}

const categories = [
  'buying-guide',
  'selling-guide',
  'vin-check',
  'local-houston',
  'local-dallas',
  'local-austin',
  'local-katy',
  'finance',
  'maintenance',
];

export default function BlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [post, setPost] = useState<BlogPost>({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    author: 'CarLynx Team',
    category: 'buying-guide',
    tags: [],
    seo_keywords: [],
    internal_links: [],
    is_published: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin && postId) {
      fetchPost();
    }
  }, [isAdmin, postId]);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();
    const isAdminUser = data?.user?.email === 'admin@carlynx.us';
    setIsAdmin(isAdminUser);
    if (!isAdminUser) {
      router.push('/');
    }
  }

  async function fetchPost() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!post.title || !post.slug || !post.excerpt || !post.content) {
      alert('Please fill in all required fields');
      return;
    }

    // Generate slug from title if needed
    const finalSlug = post.slug || post.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    setSaving(true);
    try {
      if (postId) {
        // Update
        const { error } = await supabase
          .from('blog_posts')
          .update({
            ...post,
            slug: finalSlug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', postId);

        if (error) throw error;
        alert('Post updated successfully!');
      } else {
        // Create
        const { error } = await supabase
          .from('blog_posts')
          .insert([{
            ...post,
            slug: finalSlug,
          }]);

        if (error) throw error;
        alert('Post created successfully!');
      }

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return <div className="pt-24 text-center">Loading...</div>;
  }

  if (postId && loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/blog')}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
          >
            ← Back to Blog Management
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {postId ? 'Edit Article' : 'Create Article'}
          </h1>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Article title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                value={post.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '') })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="how-to-buy-used-car"
              />
              <p className="text-xs text-gray-500 mt-1">Used in URL: /blog/{post.slug}</p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Excerpt (Short Summary) *
              </label>
              <textarea
                value={post.excerpt}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Brief description for preview"
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                value={post.featured_image_url || ''}
                onChange={(e) => setPost({ ...post, featured_image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={post.category}
                  onChange={(e) => setPost({ ...post, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={post.author}
                  onChange={(e) => setPost({ ...post, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Author name"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content (HTML) *
              </label>
              <textarea
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="<h2>Section Title</h2><p>Your content here...</p>"
              />
              <p className="text-xs text-gray-500 mt-1">Enter HTML content (h2, p, ul, li, strong, etc.)</p>
            </div>

            {/* SEO Keywords */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SEO Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newKeyword = keywordInput.trim();
                    if (newKeyword && !post.seo_keywords.includes(newKeyword)) {
                      setPost({ ...post, seo_keywords: [...post.seo_keywords, newKeyword] });
                      setKeywordInput('');
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Type keyword and press Enter"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {post.seo_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => setPost({
                        ...post,
                        seo_keywords: post.seo_keywords.filter((_, i) => i !== idx)
                      })}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (newTag && !post.tags.includes(newTag)) {
                      setPost({ ...post, tags: [...post.tags, newTag] });
                      setTagInput('');
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Type tag and press Enter"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setPost({
                        ...post,
                        tags: post.tags.filter((_, i) => i !== idx)
                      })}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Internal Links */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Internal Links (to promote on page)
              </label>
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const newLink = linkInput.trim();
                    if (newLink && !post.internal_links.includes(newLink)) {
                      setPost({ ...post, internal_links: [...post.internal_links, newLink] });
                      setLinkInput('');
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="/search-results or /browse or /listing/[id]"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {post.internal_links.map((link, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {link}
                    <button
                      type="button"
                      onClick={() => setPost({
                        ...post,
                        internal_links: post.internal_links.filter((_, i) => i !== idx)
                      })}
                      className="text-green-600 hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Publish Status */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={post.is_published}
                  onChange={(e) => setPost({ ...post, is_published: e.target.checked })}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
                <span className="font-semibold text-gray-700">
                  Publish immediately (uncheck to save as draft)
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin/blog')}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : postId ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
