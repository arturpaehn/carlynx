'use client';

import { Suspense } from 'react';
import BlogPageContent from './content';

export default function BlogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogPageContent />
    </Suspense>
  );
}
