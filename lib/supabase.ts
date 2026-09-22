import { createClient } from '@supabase/supabase-js';

// Uso exclusivamente server-side (Server Components e Route Handlers em app/api).
// Usamos a service_role key (não a anon key): ela ignora as políticas de RLS,
// então é o próprio banco de dados que impede qualquer acesso direto do
// navegador às tabelas de pedidos — só o nosso backend consegue lê-las/gravá-las.
// Por isso NUNCA prefixamos a variável com NEXT_PUBLIC_ nem a expomos em código
// que rode no cliente, e ela deve existir apenas em .env.local / nas variáveis
// de ambiente do Vercel, nunca commitada.
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && serviceRoleKey);

export const supabase = isSupabaseConfigured
  ? createClient(url as string, serviceRoleKey as string, {
      auth: { persistSession: false },
    })
  : null;
