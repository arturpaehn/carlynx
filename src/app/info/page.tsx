"use client";
import { useEffect, useState } from 'react';
import UsefulInfoVinLinks from '@/components/UsefulInfoVinLinks';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface Article {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function InfoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, summary, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) setArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  return (
  <div className="max-w-2xl mx-auto py-12 px-4 pt-40">
      <h1 className="text-2xl font-extrabold mb-6 text-center bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-700 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
        <span className="inline-block align-middle">
          <svg className="inline-block w-6 h-6 mr-2 align-middle text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
          Useful Information
        </span>
      </h1>
  <UsefulInfoVinLinks />
  {loading ? (
        <div className="text-center">Загрузка...</div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500">No articles yet.</div>
      ) : (
        <ul className="space-y-6">
          {articles.map(article => (
            <li key={article.id} className="border rounded p-4 bg-white shadow-sm hover:shadow-md transition">
              <Link href={`/info/${article.id}`} className="block">
                <h2 className="text-lg font-semibold mb-1">{article.title}</h2>
                <div className="text-gray-600 text-sm mb-2">{new Date(article.created_at).toLocaleDateString()}</div>
                <div className="text-gray-800">{article.summary}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
