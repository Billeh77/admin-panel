import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey, 'length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('\n=== Testing caption_votes table ===\n');

  // 1. Get a sample of captions
  console.log('1. Fetching 10 sample captions...');
  const { data: captions, error: captionsError } = await supabase
    .from('captions')
    .select('id, content')
    .limit(10);
  
  if (captionsError) {
    console.log('Captions error:', captionsError.message);
    return;
  }
  console.log('Captions found:', captions.length);
  captions.forEach((c, i) => console.log(`  ${i+1}. ${c.id} - "${c.content?.slice(0, 30)}..."`));

  // 2. Get a sample of caption_votes
  console.log('\n2. Fetching 10 sample caption_votes...');
  const { data: votes, error: votesError } = await supabase
    .from('caption_votes')
    .select('*')
    .limit(10);
  
  if (votesError) {
    console.log('Votes error:', votesError.message);
    return;
  }
  console.log('Votes found:', votes.length);
  console.log('Vote columns:', votes.length > 0 ? Object.keys(votes[0]) : 'none');
  votes.forEach((v, i) => console.log(`  ${i+1}.`, JSON.stringify(v)));

  // 3. Check if any votes exist for our sample captions
  console.log('\n3. Checking votes for sample caption IDs...');
  const captionIds = captions.map(c => c.id);
  const { data: matchingVotes, error: matchError } = await supabase
    .from('caption_votes')
    .select('*')
    .in('caption_id', captionIds);
  
  if (matchError) {
    console.log('Match error:', matchError.message);
  } else {
    console.log('Matching votes found:', matchingVotes?.length || 0);
    if (matchingVotes && matchingVotes.length > 0) {
      matchingVotes.forEach((v, i) => console.log(`  ${i+1}.`, JSON.stringify(v)));
    }
  }

  // 4. Get total count of caption_votes
  console.log('\n4. Total caption_votes count...');
  const { count } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true });
  console.log('Total votes in table:', count);

  // 5. Check unique caption_ids in votes
  console.log('\n5. Checking unique caption_ids in votes...');
  const { data: uniqueVotes } = await supabase
    .from('caption_votes')
    .select('caption_id')
    .limit(100);
  const uniqueIds = [...new Set(uniqueVotes?.map(v => v.caption_id))];
  console.log('Unique caption_ids in first 100 votes:', uniqueIds.length);
  console.log('Sample caption_ids from votes:', uniqueIds.slice(0, 5));

  // 6. Check if those vote caption_ids exist in captions table
  console.log('\n6. Do vote caption_ids exist in captions table?');
  if (uniqueIds.length > 0) {
    const { data: matchingCaptions, error: matchCaptionsError } = await supabase
      .from('captions')
      .select('id')
      .in('id', uniqueIds.slice(0, 5));
    
    if (matchCaptionsError) {
      console.log('Error:', matchCaptionsError.message);
    } else {
      console.log('Matching captions found:', matchingCaptions?.length || 0);
    }
  }
}

test().catch(console.error);
