import { History } from 'lucide-react';
import { listAuditLogs } from '@/lib/admin-data';
import { Table, Td } from '@/components/ui/Table';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

function formatValue(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <h2>Auditoria ({logs.length})</h2>
      <p className="hint-text">
        Últimas {logs.length} mudanças sensíveis registradas (status de pedido, preço de item, papéis de usuário).
      </p>

      {logs.length === 0 ? (
        <EmptyState icon={History} title="Nenhum registro de auditoria ainda" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>Ação</th>
              <th>Entidade</th>
              <th>Antes</th>
              <th>Depois</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <Td label="Quando">{log.createdAt}</Td>
                <Td label="Quem">{log.userEmail ?? '—'}</Td>
                <Td label="Ação">{log.action}</Td>
                <Td label="Entidade">
                  {log.entity}
                  {log.entityId && <> #{log.entityId.slice(0, 8)}</>}
                </Td>
                <Td label="Antes" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatValue(log.oldValue)}
                </Td>
                <Td label="Depois" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatValue(log.newValue)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
