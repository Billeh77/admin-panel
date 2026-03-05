import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If there's an OAuth error from the provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Success - redirect to dashboard (middleware will check superadmin)
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
