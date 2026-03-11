import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { TermsTable } from '@/components/TermsTable';

export const revalidate = 0;

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: terms, error } = await supabase
    .from('terms')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching terms:', error);
  }

  // Get term types
  const { data: termTypes } = await supabase
    .from('term_types')
    .select('*')
    .order('name');

  const termTypeMap = new Map(termTypes?.map(t => [t.id, t.name]) || []);

  const termsWithTypes = terms?.map(term => ({
    ...term,
    type_name: termTypeMap.get(term.term_type_id) || 'Unknown',
  })) || [];

  return (
    <AdminLayout currentPage="terms" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Terms</h2>
            <p className="text-slate-400 text-sm mt-1">
              {terms?.length || 0} terms • {termTypes?.length || 0} types
            </p>
          </div>
        </div>

        <TermsTable terms={termsWithTypes} termTypes={termTypes || []} />
      </div>
    </AdminLayout>
  );
}
