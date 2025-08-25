
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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="border rounded-lg bg-white shadow-md p-6 md:p-8 overflow-x-auto">
        <h1 className="text-2xl font-bold mb-4 break-words">{article.title}</h1>
        <div className="text-gray-600 text-sm mb-6">{new Date(article.created_at).toLocaleDateString()}</div>
  <div className="prose max-w-full break-words text-justify" style={{wordBreak: 'break-word', overflowWrap: 'break-word', textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
      <div className="mt-8">
  <Link href="/info" className="text-orange-600 hover:underline">&larr; Back to articles list</Link>
      </div>
    </div>
  );
}
