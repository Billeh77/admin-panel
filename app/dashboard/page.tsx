import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch statistics
  const [
    { count: totalProfiles },
    { count: totalImages },
    { count: publicImages },
    { count: totalCaptions },
    { count: publicCaptions },
    { count: featuredCaptions },
    { count: totalVotes },
    { data: recentCaptions },
    { data: topCaptions },
    { data: recentUsers },
    { data: votes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('id, content, like_count, created_datetime_utc').order('created_datetime_utc', { ascending: false }).limit(5),
    supabase.from('captions').select('id, content, like_count').order('like_count', { ascending: false }).limit(5),
    supabase.from('profiles').select('id, first_name, last_name, email, created_datetime_utc').order('created_datetime_utc', { ascending: false }).limit(5),
    supabase.from('caption_votes').select('vote_value'),
  ]);

  // Use publicCaptions to avoid unused variable warning
  void publicCaptions;

  // Calculate vote distribution
  const upvotes = votes?.filter(v => v.vote_value === 1).length || 0;
  const downvotes = votes?.filter(v => v.vote_value === -1).length || 0;
  const upvotePercentage = totalVotes ? Math.round((upvotes / (totalVotes || 1)) * 100) : 0;

  const stats = [
    { label: 'Total Users', value: totalProfiles ?? 0, icon: '👥', color: 'from-blue-500 to-cyan-500', subtext: null },
    { label: 'Total Images', value: totalImages ?? 0, icon: '🖼️', color: 'from-purple-500 to-pink-500', subtext: `${publicImages ?? 0} public` },
    { label: 'Total Captions', value: totalCaptions ?? 0, icon: '💬', color: 'from-amber-500 to-orange-500', subtext: `${featuredCaptions ?? 0} featured` },
    { label: 'Total Votes', value: totalVotes ?? 0, icon: '🗳️', color: 'from-green-500 to-emerald-500', subtext: `${upvotePercentage}% positive` },
  ];

  return (
    <AdminLayout currentPage="dashboard" userEmail={user.email || ''}>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
                {stat.subtext && (
                  <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vote Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Vote Distribution</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-400">👍 Upvotes: {upvotes.toLocaleString()}</span>
                <span className="text-red-400">👎 Downvotes: {downvotes.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-400 transition-all"
                  style={{ width: `${upvotePercentage}%` }}
                />
                <div 
                  className="bg-gradient-to-r from-red-400 to-red-500 transition-all"
                  style={{ width: `${100 - upvotePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Captions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Rated Captions</h3>
            <div className="space-y-3">
              {topCaptions?.map((caption, i) => (
                <div key={caption.id} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <span className={`text-lg font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">&ldquo;{caption.content}&rdquo;</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {caption.like_count ?? 0} votes
                    </p>
                  </div>
                </div>
              ))}
              {!topCaptions?.length && (
                <p className="text-slate-500 text-sm">No captions yet</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">👋 Recent Users</h3>
            <div className="space-y-3">
              {recentUsers?.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                    {(profile.first_name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile.created_datetime_utc 
                        ? new Date(profile.created_datetime_utc).toLocaleDateString()
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
              ))}
              {!recentUsers?.length && (
                <p className="text-slate-500 text-sm">No users yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Captions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📝 Recent Captions</h3>
          <div className="space-y-3">
            {recentCaptions?.map((caption) => (
              <div key={caption.id} className="flex items-start justify-between gap-4 p-3 bg-slate-800/50 rounded-xl">
                <p className="text-sm text-white flex-1">&ldquo;{caption.content}&rdquo;</p>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">
                    {caption.created_datetime_utc 
                      ? new Date(caption.created_datetime_utc).toLocaleDateString()
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500">{caption.like_count ?? 0} votes</p>
                </div>
              </div>
            ))}
            {!recentCaptions?.length && (
              <p className="text-slate-500 text-sm">No captions yet</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
