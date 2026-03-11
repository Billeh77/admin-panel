import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { HumorMixTable } from '@/components/HumorMixTable';

export const revalidate = 0;

export default async function HumorMixPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mixes, error } = await supabase
    .from('humor_flavor_mix')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    console.error('Error fetching humor flavor mix:', error);
  }

  // Get flavor names
  const { data: flavors } = await supabase
    .from('humor_flavors')
    .select('id, slug, description');

  const flavorMap = new Map(flavors?.map(f => [f.id, { slug: f.slug, description: f.description }]) || []);

  // Calculate total caption count
  const totalCaptions = mixes?.reduce((sum, m) => sum + (m.caption_count || 0), 0) || 0;

  const mixesWithFlavors = mixes?.map(mix => ({
    ...mix,
    flavor: flavorMap.get(mix.humor_flavor_id),
  })) || [];

  return (
    <AdminLayout currentPage="humor-mix" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Humor Flavor Mix</h2>
            <p className="text-slate-400 text-sm mt-1">
              {mixes?.length || 0} flavor mixes • {totalCaptions} total captions configured
            </p>
          </div>
        </div>

        <HumorMixTable 
          mixes={mixesWithFlavors} 
          allFlavors={flavors || []} 
        />
      </div>
    </AdminLayout>
  );
}
