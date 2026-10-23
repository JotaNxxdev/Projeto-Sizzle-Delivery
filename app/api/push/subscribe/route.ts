import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SubscribeBody | null;
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Inscrição de notificação inválida.' }, { status: 400 });
  }

  // upsert por endpoint — o mesmo dispositivo pode reinscrever (ex: depois
  // de limpar dados do navegador) sem criar duplicata.
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: profile.id, endpoint, p256dh, auth_key: auth }, { onConflict: 'endpoint' });

  if (error) {
    console.error('[Sizzle] Erro ao salvar inscrição de push:', error.message);
    return NextResponse.json({ error: 'Não foi possível ativar as notificações.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: 'Endpoint é obrigatório.' }, { status: 400 });
  }

  await supabase.from('push_subscriptions').delete().eq('user_id', profile.id).eq('endpoint', body.endpoint);
  return NextResponse.json({ success: true });
}
