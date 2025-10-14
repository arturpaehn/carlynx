"use client";
import { useEffect, useState } from 'react';
import UsefulInfoVinLinks from '@/components/UsefulInfoVinLinks';
import AveragePriceCalculator from '@/components/AveragePriceCalculator';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useTranslation } from '@/components/I18nProvider';

interface Article {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function InfoPage() {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden">
      {/* Анимированные декоративные элементы в стиле сайта */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-60 right-20 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-xl opacity-15 animate-pulse animation-delay-1000"></div>
      <div className="absolute bottom-40 left-1/3 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-xl opacity-25 animate-pulse animation-delay-2000"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4 pt-header">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-700 bg-clip-text text-transparent leading-tight">
            <span className="inline-flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
              {t('usefulInformation')}
            </span>
          </h1>
        </div>
        
        <div className="mb-8">
          <UsefulInfoVinLinks />
        </div>

        {/* Average Price Calculator */}
        <div className="mb-8">
          <AveragePriceCalculator />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">{t('loading')}</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">{t('noArticlesYet')}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <div key={article.id} className="group">
                <Link href={`/info/${article.id}`} className="block">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:scale-[1.01] hover:bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors duration-300 flex-1 pr-4">
                        {article.title}
                      </h2>
                      <div className="flex items-center text-gray-500 text-sm flex-shrink-0">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 10h18M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 14h6" />
                        </svg>
                        {new Date(article.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">{article.summary}</p>
                    <div className="flex items-center text-orange-600 font-medium text-sm group-hover:text-orange-700">
                      {t('readMore')}
                      <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
