import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all profiles with their stats
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_datetime_utc', { ascending: false });

  // Get caption counts per user
  const { data: captionCounts } = await supabase
    .from('captions')
    .select('profile_id');

  // Get vote counts per user
  const { data: voteCounts } = await supabase
    .from('caption_votes')
    .select('profile_id');

  // Get image counts per user
  const { data: imageCounts } = await supabase
    .from('images')
    .select('profile_id');

  // Create count maps
  const captionCountMap = new Map<string, number>();
  captionCounts?.forEach(c => {
    if (c.profile_id) {
      captionCountMap.set(c.profile_id, (captionCountMap.get(c.profile_id) || 0) + 1);
    }
  });

  const voteCountMap = new Map<string, number>();
  voteCounts?.forEach(v => {
    if (v.profile_id) {
      voteCountMap.set(v.profile_id, (voteCountMap.get(v.profile_id) || 0) + 1);
    }
  });

  const imageCountMap = new Map<string, number>();
  imageCounts?.forEach(i => {
    if (i.profile_id) {
      imageCountMap.set(i.profile_id, (imageCountMap.get(i.profile_id) || 0) + 1);
    }
  });

  return (
    <AdminLayout currentPage="users" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Users</h2>
            <p className="text-slate-400 text-sm mt-1">
              {profiles?.length || 0} total users
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            Error loading users: {error.message}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Captions</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Images</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Votes</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Roles</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {profiles?.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                            {(profile.first_name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {profile.first_name && profile.last_name 
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile.first_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{profile.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-300">{profile.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-slate-300">{captionCountMap.get(profile.id) || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-slate-300">{imageCountMap.get(profile.id) || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-slate-300">{voteCountMap.get(profile.id) || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {profile.is_superadmin && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Admin
                            </span>
                          )}
                          {profile.is_matrix_admin && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Matrix
                            </span>
                          )}
                          {profile.is_in_study && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Study
                            </span>
                          )}
                          {!profile.is_superadmin && !profile.is_matrix_admin && !profile.is_in_study && (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400">
                          {profile.created_datetime_utc 
                            ? new Date(profile.created_datetime_utc).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
