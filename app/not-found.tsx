import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="screen">
      <main className="app-main-menu" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>404</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>Essa página não existe ou foi removida.</p>
        <Link href="/" className="ui-button ui-button-primary ui-button-md" style={{ display: 'inline-flex' }}>
          Voltar para o início
        </Link>
      </main>
    </div>
  );
}
