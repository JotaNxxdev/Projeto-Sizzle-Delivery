import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="screen">
      <main className="app-main-menu" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>404</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Essa página não existe ou foi removida.</p>
        <Link href="/" className="checkout-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Voltar para o início
        </Link>
      </main>
    </div>
  );
}
