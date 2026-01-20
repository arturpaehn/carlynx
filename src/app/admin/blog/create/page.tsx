import { redirect } from 'next/navigation';

export default function CreateBlogPage() {
  // Redirect to edit page which handles both create and edit
  redirect('/admin/blog/new/edit');
}
