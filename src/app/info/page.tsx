"use client";
import { useEffect, useState } from 'react';
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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Полезная информация</h1>
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
