"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';

interface Article {
  id: number;
  title: string;
  summary: string;
  content?: string;
  created_at: string;
}

export default function AdminArticlesPage() {
  const userProfile = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  // const [loading, setLoading] = useState(true); // больше не используется
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile || !('email' in userProfile) || userProfile.email !== 'admin@carlynx.us') return;
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, summary, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) setArticles(data);
    };
    fetchArticles();
  }, [userProfile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.summary || !form.content) {
      setError('All fields are required');
      return;
    }
    const { error } = await supabase.from('articles').insert([
      { title: form.title, summary: form.summary, content: form.content }
    ]);
    if (error) {
      setError('Failed to add article: ' + (error.message || error.details || 'Unknown error'));
      return;
    }
    setShowForm(false);
    setForm({ title: '', summary: '', content: '' });
    // reload
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false });
  setArticles(data || []);
  };

  const handleDelete = async (id: number) => {
  if (!window.confirm('Delete this article?')) return;
    await supabase.from('articles').delete().eq('id', id);
    setArticles(articles.filter(a => a.id !== id));
  };

  if (!userProfile || !('email' in userProfile) || userProfile.email !== 'admin@carlynx.us') return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
  <Link href="/info" className="inline-block mb-4 text-blue-600 hover:underline">&larr; Back to articles list</Link>
      <h1 className="text-2xl font-bold mb-6 text-center">Manage Articles</h1>
      <button
        className="mb-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel' : 'Add Article'}
      </button>
      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 space-y-4 bg-white p-4 rounded shadow">
          <input
            name="title"
            value={form.title}
            onChange={handleInput}
            placeholder="Title"
            className="w-full border p-2 rounded"
          />
          <input
            name="summary"
            value={form.summary}
            onChange={handleInput}
            placeholder="Summary"
            className="w-full border p-2 rounded"
          />
          <textarea
            name="content"
            value={form.content}
            onChange={handleInput}
            placeholder="Article text (HTML or Markdown)"
            className="w-full border p-2 rounded min-h-[120px]"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" type="submit">
            Save
          </button>
        </form>
      )}
      <ul className="space-y-4">
        {articles.map(article => (
          <li key={article.id} className="border rounded p-4 bg-white shadow-sm flex justify-between items-center">
            <div>
              <div className="font-semibold">{article.title}</div>
              <div className="text-gray-600 text-sm">{new Date(article.created_at).toLocaleDateString()}</div>
            </div>
            <button
              className="text-red-600 hover:underline"
              onClick={() => handleDelete(article.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
