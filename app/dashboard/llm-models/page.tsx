import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { LLMModelsTable } from '@/components/LLMModelsTable';

export const revalidate = 0;

export default async function LLMModelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: models, error } = await supabase
    .from('llm_models')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    console.error('Error fetching LLM models:', error);
  }

  // Get providers
  const { data: providers } = await supabase
    .from('llm_providers')
    .select('*')
    .order('name');

  const providerMap = new Map(providers?.map(p => [p.id, p.name]) || []);

  const modelsWithProviders = models?.map(m => ({
    ...m,
    provider_name: providerMap.get(m.llm_provider_id) || 'Unknown',
  })) || [];

  // Count usage in responses
  const { data: responseCounts } = await supabase
    .from('llm_model_responses')
    .select('llm_model_id');

  const usageMap = new Map<number, number>();
  responseCounts?.forEach(r => {
    if (r.llm_model_id) {
      usageMap.set(r.llm_model_id, (usageMap.get(r.llm_model_id) || 0) + 1);
    }
  });

  return (
    <AdminLayout currentPage="llm-models" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">LLM Models</h2>
          <p className="text-slate-400 text-sm mt-1">
            {models?.length || 0} models from {providers?.length || 0} providers
          </p>
        </div>

        <LLMModelsTable 
          models={modelsWithProviders} 
          providers={providers || []} 
          usageMap={Object.fromEntries(usageMap)}
        />
      </div>
    </AdminLayout>
  );
}
