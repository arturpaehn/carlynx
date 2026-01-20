'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  is_published: boolean;
  published_at: string;
  view_count: number;
  created_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data } = await supabase.auth.getUser();
    const isAdminUser = data?.user?.email === 'admin@carlynx.us';
    setIsAdmin(isAdminUser);
    if (isAdminUser) {
      fetchPosts();
    }
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: number) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }

  async function togglePublish(post: BlogPost) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: !post.is_published })
        .eq('id', post.id);

      if (error) throw error;
      setPosts(posts.map(p => p.id === post.id ? { ...p, is_published: !p.is_published } : p));
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">Only admins can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <Link
            href="/admin/blog/create"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all"
          >
            + Create Article
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Posts</div>
            <div className="text-3xl font-bold text-blue-600">{posts.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Published</div>
            <div className="text-3xl font-bold text-green-600">{posts.filter(p => p.is_published).length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-gray-500">
            <div className="text-sm text-gray-600">Total Views</div>
            <div className="text-3xl font-bold text-gray-600">{posts.reduce((sum, p) => sum + p.view_count, 0)}</div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No posts yet. <Link href="/admin/blog/create" className="text-orange-500 hover:underline">Create one</Link></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-orange-500 hover:underline font-medium"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {post.category?.replace('-', ' ').toUpperCase() || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => togglePublish(post)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            post.is_published
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {post.is_published ? '✓ Published' : '○ Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="font-medium">{post.view_count}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-green-500 hover:text-green-700 font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
