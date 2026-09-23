import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';
import { getAddressesForUser } from '@/lib/addresses';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ addresses: [] });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ addresses: [] });
  }

  const addresses = await getAddressesForUser(profile.id);
  return NextResponse.json({ addresses });
}
