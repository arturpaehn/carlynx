'use client';

import { Suspense } from 'react';
import BlogEditPageContent from './content';

export default function BlogEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogEditPageContent />
    </Suspense>
  );
}
