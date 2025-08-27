
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

interface ArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, summary, content, created_at')
    .eq('id', id)
    .single();

  if (error || !data) return notFound();
  const article = data as Article;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden">
      {/* Анимированные декоративные элементы */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-60 right-20 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-xl opacity-15 animate-pulse animation-delay-1000"></div>
      <div className="absolute bottom-40 left-1/3 w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-xl opacity-25 animate-pulse animation-delay-2000"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4 pt-header">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200/30 p-6 md:p-8 overflow-x-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 break-words bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-700 bg-clip-text text-transparent leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center text-gray-600 text-sm mb-6">
            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 10h18M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 14h6" />
            </svg>
            {new Date(article.created_at).toLocaleDateString()}
          </div>
          <div className="prose max-w-full break-words text-justify prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-links:text-orange-600 hover:prose-links:text-orange-700" 
               style={{wordBreak: 'break-word', overflowWrap: 'break-word', textAlign: 'justify'}} 
               dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/info" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to articles list
          </Link>
        </div>
      </div>
    </div>
  );
}
