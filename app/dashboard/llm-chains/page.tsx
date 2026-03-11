import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function LLMChainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: chains, error } = await supabase
    .from('llm_prompt_chains')
    .select('*')
    .order('created_datetime_utc', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Error fetching prompt chains:', error);
  }

  // Get total count
  const { count: totalCount } = await supabase
    .from('llm_prompt_chains')
    .select('*', { count: 'exact', head: true });

  // Get caption request info
  const requestIds = [...new Set(chains?.map(c => c.caption_request_id).filter(Boolean) || [])];
  const { data: requests } = await supabase
    .from('caption_requests')
    .select('id, profile_id, image_id')
    .in('id', requestIds.length > 0 ? requestIds : [0]);

  const requestMap = new Map(requests?.map(r => [r.id, r]) || []);

  // Get response counts per chain
  const { data: responses } = await supabase
    .from('llm_model_responses')
    .select('llm_prompt_chain_id');

  const responseCountMap = new Map<number, number>();
  responses?.forEach(r => {
    if (r.llm_prompt_chain_id) {
      responseCountMap.set(r.llm_prompt_chain_id, (responseCountMap.get(r.llm_prompt_chain_id) || 0) + 1);
    }
  });

  return (
    <AdminLayout currentPage="llm-chains" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">LLM Prompt Chains</h2>
          <p className="text-slate-400 text-sm mt-1">
            {totalCount?.toLocaleString() || 0} total chains • Showing latest 200
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Chain ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Request ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Responses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {chains?.map((chain) => {
                const request = requestMap.get(chain.caption_request_id);
                const responseCount = responseCountMap.get(chain.id) || 0;
                return (
                  <tr key={chain.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{chain.id}</td>
                    <td className="px-4 py-3">
                      {request ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                          Request #{chain.caption_request_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">{chain.caption_request_id || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        responseCount > 0 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {responseCount} response{responseCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(chain.created_datetime_utc).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {(!chains || chains.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No prompt chains found
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
