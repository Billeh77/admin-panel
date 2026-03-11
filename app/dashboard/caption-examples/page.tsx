import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { CaptionExamplesTable } from '@/components/CaptionExamplesTable';

export const revalidate = 0;

export default async function CaptionExamplesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: examples, error } = await supabase
    .from('caption_examples')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching caption examples:', error);
  }

  // Get images for linking
  const imageIds = [...new Set(examples?.map(e => e.image_id).filter(Boolean) || [])];
  const { data: images } = await supabase
    .from('images')
    .select('id, url, image_description')
    .in('id', imageIds.length > 0 ? imageIds : ['00000000-0000-0000-0000-000000000000']);

  const imageMap = new Map(images?.map(i => [i.id, i]) || []);

  const examplesWithImages = examples?.map(e => ({
    ...e,
    image: e.image_id ? imageMap.get(e.image_id) : null,
  })) || [];

  return (
    <AdminLayout currentPage="caption-examples" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Caption Examples</h2>
          <p className="text-slate-400 text-sm mt-1">
            {examples?.length || 0} examples for LLM training
          </p>
        </div>

        <CaptionExamplesTable examples={examplesWithImages} />
      </div>
    </AdminLayout>
  );
}
