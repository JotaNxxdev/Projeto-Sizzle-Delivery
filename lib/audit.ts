import type { SupabaseClient } from '@supabase/supabase-js';

interface AuditEntry {
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}

// Log de auditoria "best effort" — nunca deve derrubar a ação principal se
// falhar (por isso não propaga erro, só registra no console).
export async function logAudit(db: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    await db.from('audit_logs').insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
    });
  } catch (err) {
    console.error('[Sizzle] Erro ao gravar log de auditoria:', err);
  }
}
