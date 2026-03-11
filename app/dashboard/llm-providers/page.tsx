import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { LLMProvidersTable } from '@/components/LLMProvidersTable';

export const revalidate = 0;

export default async function LLMProvidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: providers, error } = await supabase
    .from('llm_providers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching LLM providers:', error);
  }

  // Get model counts per provider
  const { data: models } = await supabase
    .from('llm_models')
    .select('llm_provider_id');

  const modelCountMap = new Map<number, number>();
  models?.forEach(m => {
    if (m.llm_provider_id) {
      modelCountMap.set(m.llm_provider_id, (modelCountMap.get(m.llm_provider_id) || 0) + 1);
    }
  });

  const providersWithCounts = providers?.map(p => ({
    ...p,
    model_count: modelCountMap.get(p.id) || 0,
  })) || [];

  return (
    <AdminLayout currentPage="llm-providers" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">LLM Providers</h2>
          <p className="text-slate-400 text-sm mt-1">
            {providers?.length || 0} providers • {models?.length || 0} total models
          </p>
        </div>

        <LLMProvidersTable providers={providersWithCounts} />
      </div>
    </AdminLayout>
  );
}
