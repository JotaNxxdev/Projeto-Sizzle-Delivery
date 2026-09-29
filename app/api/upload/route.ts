import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentProfile } from '@/lib/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Recebe um arquivo de imagem e sobe pro Supabase Storage, devolvendo a URL
// pública — em vez de embutir o arquivo inteiro em base64 direto no banco
// (o que inflava a home pra vários MB, ver relatório de QA).
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Você precisa estar logado.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Formato de imagem não suportado. Use JPEG, PNG, WEBP ou GIF.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Imagem muito grande. Tamanho máximo: 5MB.' }, { status: 400 });
  }

  const extension = file.type.split('/')[1];
  const path = `${profile.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('images').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error('[Sizzle] Erro ao subir imagem:', uploadError.message);
    return NextResponse.json({ error: 'Não foi possível salvar a imagem.' }, { status: 500 });
  }

  const { data } = supabase.storage.from('images').getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
