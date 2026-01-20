import Link from 'next/link';
import Image from 'next/image';

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

export default function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.published_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const categoryColors: Record<string, string> = {
    'buying-guide': 'bg-blue-100 text-blue-800',
    'selling-guide': 'bg-green-100 text-green-800',
    'vin-check': 'bg-purple-100 text-purple-800',
    'local-houston': 'bg-orange-100 text-orange-800',
    'local-dallas': 'bg-red-100 text-red-800',
    'local-austin': 'bg-pink-100 text-pink-800',
    'local-katy': 'bg-indigo-100 text-indigo-800',
    finance: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-gray-100 text-gray-800',
  };

  const categoryLabel = post.category?.replace('-', ' ').toUpperCase() || 'ARTICLE';
  const categoryColor = categoryColors[post.category] || 'bg-gray-100 text-gray-800';

  return (
    <Link href={`/blog/${post.slug}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105 cursor-pointer h-full">
        {/* Image */}
        {post.featured_image_url && (
          <div className="relative h-48 w-full bg-gray-200">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex flex-col h-full">
          {/* Category Badge */}
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
              {categoryLabel}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 flex-grow">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
            {post.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
