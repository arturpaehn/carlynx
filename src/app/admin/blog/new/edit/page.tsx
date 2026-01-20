import { redirect } from 'next/navigation';

export default function NewBlogPage() {
  // This is handled by the [id]/edit/page component
  // Just render the same edit page without an ID (for creation)
  redirect('/admin/blog/create/edit');
}
