import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { ImageTable } from '@/components/ImageTable';

export const revalidate = 0;

export default async function ImagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all images with caption counts
  const { data: images, error } = await supabase
    .from('images')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  // Get caption counts per image
  const { data: captionCounts } = await supabase
    .from('captions')
    .select('image_id');

  const captionCountMap = new Map<string, number>();
  captionCounts?.forEach(c => {
    if (c.image_id) {
      captionCountMap.set(c.image_id, (captionCountMap.get(c.image_id) || 0) + 1);
    }
  });

  // Add caption counts to images
  const imagesWithCounts = images?.map(img => ({
    ...img,
    caption_count: captionCountMap.get(img.id) || 0,
  })) || [];

  return (
    <AdminLayout currentPage="images" userEmail={user.email || ''}>
      <ImageTable images={imagesWithCounts} error={error?.message} />
    </AdminLayout>
  );
}
