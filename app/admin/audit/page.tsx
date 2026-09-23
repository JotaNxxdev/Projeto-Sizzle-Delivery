import { listAuditLogs } from '@/lib/admin-data';

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
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0 }}>
        Últimas {logs.length} mudanças sensíveis registradas (status de pedido, preço de item, papéis de usuário).
      </p>

      {logs.length === 0 ? (
        <p className="empty-state">Nenhum registro de auditoria ainda.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
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
                  <td>{log.createdAt}</td>
                  <td>{log.userEmail ?? '—'}</td>
                  <td>{log.action}</td>
                  <td>
                    {log.entity}
                    {log.entityId && <> #{log.entityId.slice(0, 8)}</>}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{formatValue(log.oldValue)}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatValue(log.newValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
