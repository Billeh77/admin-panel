import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { SafeImage } from '@/components/SafeImage';

export const revalidate = 0;

export default async function CaptionRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch recent caption requests
  const { data: requests, error } = await supabase
    .from('caption_requests')
    .select('*')
    .order('created_datetime_utc', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching caption requests:', error);
  }

  // Get total count
  const { count: totalCount } = await supabase
    .from('caption_requests')
    .select('*', { count: 'exact', head: true });

  // Get profiles for user names
  const profileIds = [...new Set(requests?.map(r => r.profile_id).filter(Boolean) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name');

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Get images
  const imageIds = [...new Set(requests?.map(r => r.image_id).filter(Boolean) || [])];
  const { data: images } = await supabase
    .from('images')
    .select('id, url, image_description');

  const imageMap = new Map(images?.map(i => [i.id, i]) || []);

  // Aggregate stats
  const requestsByUser = new Map<string, number>();
  requests?.forEach(r => {
    if (r.profile_id) {
      requestsByUser.set(r.profile_id, (requestsByUser.get(r.profile_id) || 0) + 1);
    }
  });

  const topRequesters = Array.from(requestsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AdminLayout currentPage="caption-requests" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Caption Requests</h2>
          <p className="text-slate-400 text-sm mt-1">
            {totalCount?.toLocaleString() || 0} total requests • Showing latest 500
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-2">Unique Users</h4>
            <p className="text-2xl font-bold text-white">{profileIds.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-2">Unique Images</h4>
            <p className="text-2xl font-bold text-white">{imageIds.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <h4 className="text-sm text-slate-400 mb-2">Top Requester</h4>
            {topRequesters[0] ? (
              <p className="text-lg font-bold text-white truncate">
                {profileMap.get(topRequesters[0][0])?.email || 'Unknown'}
                <span className="text-sm text-slate-400 ml-2">({topRequesters[0][1]})</span>
              </p>
            ) : (
              <p className="text-slate-500">—</p>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {requests?.map((request) => {
                  const profile = profileMap.get(request.profile_id);
                  const image = imageMap.get(request.image_id);
                  return (
                    <tr key={request.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">{request.id}</td>
                      <td className="px-4 py-3">
                        {image?.url ? (
                          <div className="flex items-center gap-3">
                            <SafeImage
                              src={image.url}
                              alt="Request image"
                              className="w-12 h-12 rounded-md object-cover"
                            />
                            <span className="text-xs text-slate-400 max-w-[200px] truncate">
                              {image.image_description?.substring(0, 50) || 'No description'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {profile ? (
                          <div>
                            <p className="text-sm text-white">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <p className="text-xs text-slate-400">{profile.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">{request.profile_id?.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(request.created_datetime_utc).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {(!requests || requests.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No caption requests found
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
