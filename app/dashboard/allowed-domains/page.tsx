import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { AllowedDomainsTable } from '@/components/AllowedDomainsTable';

export const revalidate = 0;

export default async function AllowedDomainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: domains, error } = await supabase
    .from('allowed_signup_domains')
    .select('*')
    .order('apex_domain');

  if (error) {
    console.error('Error fetching allowed domains:', error);
  }

  // Count users per domain (based on email)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email');

  const domainCounts = new Map<string, number>();
  profiles?.forEach(p => {
    if (p.email) {
      const emailDomain = p.email.split('@')[1];
      if (emailDomain) {
        domainCounts.set(emailDomain, (domainCounts.get(emailDomain) || 0) + 1);
      }
    }
  });

  const domainsWithCounts = domains?.map(d => ({
    ...d,
    user_count: domainCounts.get(d.apex_domain) || 0,
  })) || [];

  return (
    <AdminLayout currentPage="allowed-domains" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Allowed Signup Domains</h2>
          <p className="text-slate-400 text-sm mt-1">
            {domains?.length || 0} domains allowed for signup
          </p>
        </div>

        <AllowedDomainsTable domains={domainsWithCounts} />
      </div>
    </AdminLayout>
  );
}
