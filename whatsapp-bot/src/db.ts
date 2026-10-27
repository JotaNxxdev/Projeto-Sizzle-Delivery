import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Mesmo padrão do lib/supabase.ts do site: service_role key, ignora RLS.
// Só este processo (rodando no VPS, nunca em código de cliente) deve ter
// acesso a essa chave.
export const db = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
