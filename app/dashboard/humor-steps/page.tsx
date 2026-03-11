import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function HumorStepsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: steps, error } = await supabase
    .from('humor_flavor_steps')
    .select('*')
    .order('humor_flavor_id', { ascending: true })
    .order('order_by', { ascending: true });

  if (error) {
    console.error('Error fetching humor flavor steps:', error);
  }

  // Get flavor names
  const { data: flavors } = await supabase
    .from('humor_flavors')
    .select('id, slug, description');

  const flavorMap = new Map(flavors?.map(f => [f.id, f]) || []);

  // Get model names
  const { data: models } = await supabase
    .from('llm_models')
    .select('id, name');

  const modelMap = new Map(models?.map(m => [m.id, m.name]) || []);

  return (
    <AdminLayout currentPage="humor-steps" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Humor Flavor Steps</h2>
          <p className="text-slate-400 text-sm mt-1">
            {steps?.length || 0} steps configured across all flavors
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Flavor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Temp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">System Prompt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {steps?.map((step) => {
                  const flavor = flavorMap.get(step.humor_flavor_id);
                  return (
                    <tr key={step.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">{step.id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          {flavor?.slug || step.humor_flavor_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-700 rounded-full text-xs">
                          {step.order_by}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {modelMap.get(step.llm_model_id) || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                        {step.llm_temperature}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-[200px] truncate">
                        {step.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[300px] truncate font-mono">
                        {step.llm_system_prompt?.substring(0, 100) || '—'}
                        {step.llm_system_prompt && step.llm_system_prompt.length > 100 && '...'}
                      </td>
                    </tr>
                  );
                })}
                {(!steps || steps.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No humor flavor steps found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
