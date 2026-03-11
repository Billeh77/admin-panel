import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function HumorFlavorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: flavors, error } = await supabase
    .from('humor_flavors')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    console.error('Error fetching humor flavors:', error);
  }

  // Get step counts per flavor
  const { data: stepCounts } = await supabase
    .from('humor_flavor_steps')
    .select('humor_flavor_id');

  const stepCountMap = new Map<number, number>();
  stepCounts?.forEach(s => {
    const count = stepCountMap.get(s.humor_flavor_id) || 0;
    stepCountMap.set(s.humor_flavor_id, count + 1);
  });

  // Get caption counts per flavor
  const { data: captionCounts } = await supabase
    .from('captions')
    .select('humor_flavor_id');

  const captionCountMap = new Map<number, number>();
  captionCounts?.forEach(c => {
    if (c.humor_flavor_id) {
      const count = captionCountMap.get(c.humor_flavor_id) || 0;
      captionCountMap.set(c.humor_flavor_id, count + 1);
    }
  });

  return (
    <AdminLayout currentPage="humor-flavors" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Humor Flavors</h2>
          <p className="text-slate-400 text-sm mt-1">
            {flavors?.length || 0} flavors configured
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Steps</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Captions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {flavors?.map((flavor) => (
                <tr key={flavor.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300 font-mono">{flavor.id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">
                      {flavor.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate">
                    {flavor.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {stepCountMap.get(flavor.id) || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {captionCountMap.get(flavor.id) || 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!flavors || flavors.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No humor flavors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
