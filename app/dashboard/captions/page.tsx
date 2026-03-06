import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { SafeImage } from '@/components/SafeImage';

export const revalidate = 0;

export default async function CaptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // STEP 1: Get all votes using pagination (Supabase has 1000 row limit per query)
  const allVotes: { caption_id: string; vote_value: number }[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: pageVotes } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('id', { ascending: true });

    if (pageVotes && pageVotes.length > 0) {
      allVotes.push(...pageVotes);
      page++;
      hasMore = pageVotes.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
    
    // Safety limit: max 20 pages (20,000 votes)
    if (page >= 20) hasMore = false;
  }

  // Aggregate votes by caption
  const voteMap = new Map<string, { up: number; down: number }>();
  allVotes?.forEach(v => {
    if (v.caption_id) {
      const current = voteMap.get(v.caption_id) || { up: 0, down: 0 };
      if (v.vote_value === 1) current.up++;
      else if (v.vote_value === -1) current.down++;
      voteMap.set(v.caption_id, current);
    }
  });

  // STEP 2: Get caption IDs that have votes
  const votedCaptionIds = [...voteMap.keys()];

  // STEP 3: Fetch those specific captions (in batches)
  const BATCH_SIZE = 50;
  type CaptionRow = {
    id: string;
    content: string | null;
    is_public: boolean | null;
    is_featured: boolean | null;
    image_id: string | null;
    like_count: number | null;
    created_datetime_utc: string | null;
    [key: string]: unknown;
  };
  const allCaptions: CaptionRow[] = [];
  
  for (let i = 0; i < votedCaptionIds.length; i += BATCH_SIZE) {
    const batch = votedCaptionIds.slice(i, i + BATCH_SIZE);
    const { data: batchCaptions } = await supabase
      .from('captions')
      .select('*')
      .in('id', batch);
    
    if (batchCaptions) {
      allCaptions.push(...batchCaptions);
    }
  }

  // Also fetch some recent captions (even if no votes) for completeness
  const { data: recentCaptions, error } = await supabase
    .from('captions')
    .select('*', { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .limit(100);

  // Merge - add recent captions that aren't already in allCaptions
  const existingIds = new Set(allCaptions.map(c => c.id));
  recentCaptions?.forEach(c => {
    if (!existingIds.has(c.id)) {
      allCaptions.push(c);
    }
  });

  const captions = allCaptions;

  // Fetch images for preview
  const imageIds = [...new Set(captions?.map(c => c.image_id).filter(Boolean) || [])];
  const { data: images } = await supabase
    .from('images')
    .select('id, url, image_description')
    .in('id', imageIds.slice(0, 200)); // Limit image fetches

  const imageMap = new Map(images?.map(img => [img.id, img]) || []);

  // Add image and vote data to captions
  const captionsWithData = captions?.map(caption => ({
    ...caption,
    image: caption.image_id ? imageMap.get(caption.image_id) : null,
    votes: voteMap.get(caption.id) || { up: 0, down: 0 },
  })) || [];

  // Stats
  const publicCount = captions?.filter(c => c.is_public).length || 0;
  const featuredCount = captions?.filter(c => c.is_featured).length || 0;
  const totalVotesFetched = allVotes?.length || 0;
  const captionsWithVotes = captionsWithData.filter(c => c.votes.up > 0 || c.votes.down > 0).length;

  // Sort by total votes (most voted first) to show captions that actually have votes
  const sortedCaptions = [...captionsWithData].sort((a, b) => {
    const aTotal = a.votes.up + a.votes.down;
    const bTotal = b.votes.up + b.votes.down;
    return bTotal - aTotal; // Descending order
  });

  return (
    <AdminLayout currentPage="captions" userEmail={user.email || ''}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Captions</h2>
            <p className="text-slate-400 text-sm mt-1">
              {captions?.length || 0} captions loaded • {publicCount} public • {featuredCount} featured • 
              <span className="text-purple-400 ml-1">{totalVotesFetched} votes</span> • 
              <span className="text-green-400">{captionsWithVotes} with votes</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            Error loading captions: {error.message}
          </div>
        )}

        {/* Captions Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Caption</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Votes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedCaptions.map((caption) => (
                  <tr key={caption.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      {caption.image?.url ? (
                        <SafeImage
                          src={caption.image.url}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg"
                          fallback={
                            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                              Error
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white max-w-md">
                        {caption.content ? (
                          <>&ldquo;{caption.content}&rdquo;</>
                        ) : (
                          <span className="text-slate-500 italic">Empty caption</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{caption.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {caption.votes.up}
                        </span>
                        <span className="text-red-400 text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {caption.votes.down}
                        </span>
                        <span className="text-slate-500 text-xs">
                          ({caption.like_count ?? 0} net)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {caption.is_public && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Public
                          </span>
                        )}
                        {caption.is_featured && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Featured
                          </span>
                        )}
                        {!caption.is_public && !caption.is_featured && (
                          <span className="text-slate-500 text-xs">Private</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-400">
                        {caption.created_datetime_utc 
                          ? new Date(caption.created_datetime_utc).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedCaptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No captions found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
