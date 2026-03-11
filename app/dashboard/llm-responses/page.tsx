import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function LLMResponsesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: responses, error } = await supabase
    .from('llm_model_responses')
    .select('*')
    .order('created_datetime_utc', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching LLM responses:', error);
  }

  // Get total count
  const { count: totalCount } = await supabase
    .from('llm_model_responses')
    .select('*', { count: 'exact', head: true });

  // Get model names
  const { data: models } = await supabase
    .from('llm_models')
    .select('id, name');

  const modelMap = new Map(models?.map(m => [m.id, m.name]) || []);

  // Get flavor names
  const { data: flavors } = await supabase
    .from('humor_flavors')
    .select('id, slug');

  const flavorMap = new Map(flavors?.map(f => [f.id, f.slug]) || []);

  // Calculate stats
  const avgProcessingTime = responses?.length 
    ? (responses.reduce((sum, r) => sum + (r.processing_time_seconds || 0), 0) / responses.length).toFixed(2)
    : 0;

  return (
    <AdminLayout currentPage="llm-responses" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">LLM Model Responses</h2>
          <p className="text-slate-400 text-sm mt-1">
            {totalCount?.toLocaleString() || 0} total responses • Avg {avgProcessingTime}s processing time • Showing latest 100
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-1">Total Responses</h4>
            <p className="text-2xl font-bold text-white">{totalCount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-1">Avg Processing</h4>
            <p className="text-2xl font-bold text-white">{avgProcessingTime}s</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-1">Models Used</h4>
            <p className="text-2xl font-bold text-white">{models?.length || 0}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-1">Flavors Used</h4>
            <p className="text-2xl font-bold text-white">{flavors?.length || 0}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Flavor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Temp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Response Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {responses?.map((response) => (
                  <tr key={response.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {response.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {modelMap.get(response.llm_model_id) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {flavorMap.get(response.humor_flavor_id) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                      {response.llm_temperature}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {response.processing_time_seconds}s
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-[300px]">
                      <div className="truncate font-mono bg-slate-800/50 rounded px-2 py-1">
                        {response.llm_model_response?.substring(0, 100) || '—'}
                        {response.llm_model_response && response.llm_model_response.length > 100 && '...'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(response.created_datetime_utc).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!responses || responses.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No LLM responses found
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
