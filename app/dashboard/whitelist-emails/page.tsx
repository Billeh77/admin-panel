import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { WhitelistEmailsTable } from '@/components/WhitelistEmailsTable';

export const revalidate = 0;

export default async function WhitelistEmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: emails, error } = await supabase
    .from('whitelist_email_addresses')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  if (error) {
    console.error('Error fetching whitelist emails:', error);
  }

  // Check which emails have registered
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email');

  const registeredEmails = new Set(profiles?.map(p => p.email?.toLowerCase()) || []);

  const emailsWithStatus = emails?.map(e => ({
    ...e,
    is_registered: registeredEmails.has(e.email_address?.toLowerCase()),
  })) || [];

  return (
    <AdminLayout currentPage="whitelist-emails" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Whitelisted Email Addresses</h2>
          <p className="text-slate-400 text-sm mt-1">
            {emails?.length || 0} emails whitelisted • {emailsWithStatus.filter(e => e.is_registered).length} registered
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <h4 className="text-sm text-slate-400 mb-2">About Whitelisting</h4>
          <p className="text-sm text-slate-300">
            Whitelisted email addresses can sign up even if their domain is not in the allowed domains list.
            This is useful for granting access to specific individuals from outside organizations.
          </p>
        </div>

        <WhitelistEmailsTable emails={emailsWithStatus} />
      </div>
    </AdminLayout>
  );
}
