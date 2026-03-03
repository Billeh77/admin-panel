import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

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
    { count: totalVotes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Total Users', value: totalProfiles ?? 0, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Images', value: totalImages ?? 0, icon: '🖼️', color: 'from-purple-500 to-pink-500' },
    { label: 'Public Images', value: publicImages ?? 0, icon: '🌐', color: 'from-green-500 to-emerald-500' },
    { label: 'Total Captions', value: totalCaptions ?? 0, icon: '💬', color: 'from-amber-500 to-orange-500' },
    { label: 'Public Captions', value: publicCaptions ?? 0, icon: '📢', color: 'from-rose-500 to-red-500' },
    { label: 'Total Votes', value: totalVotes ?? 0, icon: '🗳️', color: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <a href="/dashboard" className="px-4 py-3 text-sm font-medium text-white border-b-2 border-amber-500">
              Dashboard
            </a>
            <a href="/dashboard/users" className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Users
            </a>
            <a href="/dashboard/images" className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Images
            </a>
            <a href="/dashboard/captions" className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Captions
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-white mb-6">Overview Statistics</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick info */}
        <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">
            <span className="text-amber-500 font-medium">Tip:</span> Use the navigation above to manage users, images, and captions.
          </p>
        </div>
      </div>
    </main>
  );
}
