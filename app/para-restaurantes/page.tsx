'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const NAV_SECTIONS = ['produto', 'recursos', 'planos', 'faq'] as const;
type SectionId = (typeof NAV_SECTIONS)[number];

const MONTHLY_PRICES = { basic: 59, pro: 129, complete: 219 };
const ANNUAL_PRICES = { basic: 49, pro: 109, complete: 185 };

function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 4C22 16 16 26 16 36a16 16 0 0 0 32 0c0-6-3-11-7-15 1 5-1 8-3 9 1-9-2-17-6-26z"
        fill="#22c55e"
      />
      <path
        d="M32 20c-5 8-8 13-8 18a8 8 0 0 0 16 0c0-3-1.5-5.5-3.5-7.5.5 2.5-.5 4-1.5 4.5.5-5-1-10.5-3-15z"
        fill="#86efac"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function ParaRestaurantesPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [activeSection, setActiveSection] = useState<SectionId>('produto');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealEls = root.querySelectorAll('.landing-reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const sections = root.querySelectorAll('section[id]');
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    sections.forEach((el) => navObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      navObserver.disconnect();
    };
  }, []);

  function handleHeroMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 10 });
  }

  const prices = billing === 'annual' ? ANNUAL_PRICES : MONTHLY_PRICES;
  const navColor = (id: SectionId) => ({ color: activeSection === id ? 'var(--color-brand-400)' : 'var(--color-text-muted)' });

  return (
    <div className="landing-page" ref={rootRef}>
      {/* NAV */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 18, fontWeight: 800 }}>
          <Logo />
          Sizzle
        </div>
        <div className="landing-nav-links" role="navigation" aria-label="Principal">
          <a href="#produto" className="landing-nav-link" style={navColor('produto')}>Produto</a>
          <a href="#recursos" className="landing-nav-link" style={navColor('recursos')}>Recursos</a>
          <a href="#planos" className="landing-nav-link" style={navColor('planos')}>Planos</a>
          <a href="#faq" className="landing-nav-link" style={navColor('faq')}>Perguntas frequentes</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" className="ui-button ui-button-ghost ui-button-sm">Entrar</Link>
          <a href="#demo" className="ui-button ui-button-primary ui-button-sm">Agendar demonstração</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-section" style={{ paddingTop: 96, paddingBottom: 80, borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner" style={{ display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'center' }}>
          <div className="landing-reveal" style={{ flex: '999 1 460px', minWidth: 0 }}>
            <span className="landing-eyebrow">Gestão de delivery pra restaurantes</span>
            <h1 style={{ fontSize: 48, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.02em', margin: '18px 0 20px' }}>
              O painel completo pra gerenciar pedidos, entrega e pagamento do seu restaurante
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-text-muted)', maxWidth: 460, margin: '0 0 32px' }}>
              Cardápio online, pedidos em tempo real, app pra entregadores e pagamentos — numa conversa de 20 minutos a gente te mostra funcionando com o cardápio do seu próprio restaurante.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <a href="#demo" className="ui-button ui-button-primary ui-button-lg">Agendar demonstração</a>
              <a href="#planos" className="ui-button ui-button-ghost ui-button-lg">Ver planos</a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 13, color: 'var(--color-text-subtle)' }}>
              <span>Sem taxa de adesão</span>
              <span>·</span>
              <span>Sem fidelidade</span>
              <span>·</span>
              <span>Suporte direto com quem constrói o produto</span>
            </div>
          </div>

          <div
            style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', justifyContent: 'center', padding: '20px 0' }}
            onMouseMove={handleHeroMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <div
              style={{
                position: 'relative',
                width: 280,
                height: 300,
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: 'transform 120ms ease-out',
              }}
            >
              <div className="landing-phone-frame" style={{ position: 'absolute', left: 0, top: 10, width: 190, transform: 'rotate(-6deg)' }}>
                <img src="/landing/home.png" alt="Tela inicial do app Sizzle Delivery" />
              </div>
              <div className="landing-phone-frame" style={{ position: 'absolute', right: 0, top: 0, width: 190, transform: 'rotate(5deg)', boxShadow: '0 30px 60px rgba(0,0,0,0.55)' }}>
                <img src="/landing/cart.png" alt="Tela de carrinho do app Sizzle Delivery" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUTO DE VERDADE */}
      <section className="landing-section" id="produto" style={{ paddingBottom: 56, borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner">
          <div className="landing-reveal" style={{ maxWidth: 600, margin: '0 auto 44px', textAlign: 'center' }}>
            <span className="landing-eyebrow">Sem protótipo, sem maquete</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 12px' }}>Isso aqui é o sistema de verdade</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', margin: 0 }}>Três telas reais da plataforma: o app do cliente, o carrinho e o painel do entregador.</p>
          </div>

          <div className="landing-reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="landing-phone-frame" style={{ width: 200 }}><img src="/landing/home.png" alt="App do cliente mostrando lista de restaurantes" /></div>
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-muted)' }}>App do cliente</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="landing-phone-frame" style={{ width: 200 }}><img src="/landing/cart.png" alt="Tela de carrinho de compras do app" /></div>
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-muted)' }}>Carrinho e checkout</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="landing-phone-frame" style={{ width: 200 }}><img src="/landing/courier.png" alt="Painel do entregador com entregas atribuídas" /></div>
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text-muted)' }}>App do entregador</p>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section className="landing-section" id="recursos" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner">
          <div className="landing-reveal" style={{ marginBottom: 48 }}>
            <span className="landing-eyebrow">Recursos</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 10px' }}>Tudo que seu restaurante precisa</h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-muted)', maxWidth: 540, margin: 0 }}>Construído pra operação de delivery de verdade, não pra uma demo.</p>
          </div>

          <div className="landing-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
            {[
              {
                title: 'Pedidos em tempo real',
                desc: 'Receba, aceite ou recuse pedidos na hora, com notificação sonora e status sincronizado com o cliente.',
                icon: <path d="M3 12h4l3 8 4-16 3 8h4" />,
              },
              {
                title: 'App do entregador',
                desc: 'Entregador assume a corrida por código ou QR code e atualiza o status direto do celular.',
                icon: (
                  <>
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <path d="M15 6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3" />
                    <path d="M9 17h6" />
                    <path d="M14 6h2l4 4.5V16a1 1 0 0 1-1 1h-1" />
                  </>
                ),
              },
              {
                title: 'Pagamentos flexíveis',
                desc: 'Pix manual, Mercado Pago integrado ou dinheiro com troco — o cliente escolhe, você recebe.',
                icon: (
                  <>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </>
                ),
              },
              {
                title: 'Relatórios e cupons',
                desc: 'Exporte relatórios em CSV, crie cupons de desconto e acompanhe as avaliações dos clientes.',
                icon: (
                  <>
                    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                    <path d="M7 15l4-4 3 3 5-6" />
                  </>
                ),
              },
            ].map((f) => (
              <div className="landing-feature-card" key={f.title}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(34,197,94,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {f.icon}
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 7px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-muted)', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner">
          <div className="landing-reveal" style={{ marginBottom: 48 }}>
            <span className="landing-eyebrow">Como funciona</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 0' }}>Do primeiro contato ao primeiro pedido</h2>
          </div>

          <div className="landing-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
            {[
              { n: '01', title: 'Agende uma conversa', desc: '20 minutos pra entender sua operação e mostrar o sistema com o seu cardápio.' },
              { n: '02', title: 'Migramos seu cardápio', desc: 'A gente ajuda a montar o cardápio, horários e áreas de entrega — sem trabalho manual pra você.' },
              { n: '03', title: 'Comece a receber pedidos', desc: 'Pedidos, entregadores e pagamento rodando no mesmo painel, com suporte direto com a gente.' },
            ].map((s) => (
              <div key={s.n}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-400)', marginBottom: 10 }}>{s.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 7px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-muted)', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="landing-section" id="planos" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner">
          <div className="landing-reveal" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 32px' }}>
            <span className="landing-eyebrow">Planos</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 10px' }}>Um plano pra cada fase do seu negócio</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', margin: 0 }}>Preço de lançamento — sem fidelidade, cancele quando quiser.</p>
          </div>

          <div className="landing-reveal" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div className="landing-toggle-wrap">
              <button type="button" className={`landing-toggle-btn${billing === 'monthly' ? ' landing-toggle-btn-active' : ''}`} onClick={() => setBilling('monthly')}>
                Mensal
              </button>
              <button type="button" className={`landing-toggle-btn${billing === 'annual' ? ' landing-toggle-btn-active' : ''}`} onClick={() => setBilling('annual')}>
                Anual
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-brand-400)', margin: '0 0 36px', minHeight: 18 }}>
            {billing === 'annual' ? 'Valor mensal equivalente, cobrado anualmente.' : ' '}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20, alignItems: 'stretch' }}>
            <div className="landing-plan-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Básico</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                <span style={{ fontSize: 34, fontWeight: 800 }}>R$ {prices.basic}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>/mês</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
                {['Cardápio online ilimitado', 'Pedidos em tempo real', 'App pra entregadores', 'Pagamento via Pix manual'].map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 9, fontSize: 14, color: 'var(--color-text-muted)' }}><CheckIcon />{item}</li>
                ))}
              </ul>
              <a href="#demo" className="ui-button ui-button-ghost ui-button-md" style={{ width: '100%' }}>Falar com vendas</a>
            </div>

            <div className="landing-plan-card" style={{ borderColor: 'var(--color-brand-500)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -11, left: 30, background: 'var(--color-brand-500)', color: '#06240f', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>
                Mais popular
              </span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-400)', margin: '8px 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Profissional</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                <span style={{ fontSize: 34, fontWeight: 800 }}>R$ {prices.pro}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>/mês</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
                {['Tudo do plano Básico', 'Cupons de desconto', 'Relatórios e exportação CSV', 'Notificações push'].map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 9, fontSize: 14, color: 'var(--color-text)' }}><CheckIcon />{item}</li>
                ))}
              </ul>
              <a href="#demo" className="ui-button ui-button-primary ui-button-md" style={{ width: '100%' }}>Agendar demonstração</a>
            </div>

            <div className="landing-plan-card">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completo</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                <span style={{ fontSize: 34, fontWeight: 800 }}>R$ {prices.complete}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>/mês</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
                {['Tudo do plano Profissional', 'Pedidos via WhatsApp (bot)', 'Pagamento integrado (Mercado Pago)', 'Suporte prioritário'].map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 9, fontSize: 14, color: 'var(--color-text-muted)' }}><CheckIcon />{item}</li>
                ))}
              </ul>
              <a href="#demo" className="ui-button ui-button-ghost ui-button-md" style={{ width: '100%' }}>Falar com vendas</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" id="faq" style={{ paddingBottom: 56, borderBottom: '1px solid var(--color-border)' }}>
        <div className="landing-section-inner" style={{ maxWidth: 720 }}>
          <div className="landing-reveal" style={{ marginBottom: 36 }}>
            <span className="landing-eyebrow">Perguntas frequentes</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 0' }}>Antes de agendar, tire suas dúvidas</h2>
          </div>

          <div className="landing-reveal">
            {[
              { q: 'Preciso trocar minha forma de pagamento atual?', a: 'Não. Você pode usar Pix manual do jeito que já recebe hoje, ou ativar o Mercado Pago integrado quando quiser — sem obrigação.' },
              { q: 'Dá pra migrar o cardápio que eu já tenho?', a: 'Sim, a gente ajuda a montar o cardápio no sistema durante a implantação — você não precisa digitar tudo sozinho.' },
              { q: 'Tem fidelidade ou multa de cancelamento?', a: 'Não. Os planos são mensais, sem contrato de permanência.' },
              { q: 'Como funciona o suporte?', a: 'Direto com o time que constrói o produto — sem central de atendimento terceirizada.' },
            ].map((item) => (
              <div className="landing-faq-item" key={item.q}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 7px' }}>{item.q}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-muted)', margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO / CONTATO */}
      <DemoForm />

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px var(--space-8)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 800 }}>
          <Logo size={20} />
          Sizzle
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-subtle)' }}>© 2026 Sizzle Delivery. Todos os direitos reservados.</p>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--color-text-subtle)' }}>
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
          <a href="#demo">Contato</a>
        </div>
      </footer>
    </div>
  );
}

function DemoForm() {
  const [name, setName] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="landing-section" id="demo">
      <div className="landing-section-inner landing-reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
        <div style={{ flex: '1 1 360px', minWidth: 280 }}>
          <span className="landing-eyebrow">Fale com a gente</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.01em', margin: '14px 0 14px' }}>Vamos conversar sobre o seu restaurante</h2>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', margin: '0 0 24px', maxWidth: 400 }}>
            Preencha os dados ao lado e a gente te chama em até 1 dia útil pra marcar uma demonstração com o seu próprio cardápio.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, maxWidth: 300 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .95.68l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11 11 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6z" />
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-subtle)' }}>Prefere falar direto?</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Chama no WhatsApp</p>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 340px', minWidth: 280, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 28 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Recebemos seu pedido!</p>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>Vamos te chamar em breve pra marcar a demonstração.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Seu nome" id="demo-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Maria Oliveira" />
              <Input label="Nome do restaurante" id="demo-restaurant" required value={restaurant} onChange={(e) => setRestaurant(e.target.value)} placeholder="Ex: Cantina da Maria" />
              <Input label="WhatsApp" id="demo-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: (11) 98765-4321" />
              <Button type="submit" variant="primary" fullWidth>
                Solicitar demonstração
              </Button>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-subtle)', textAlign: 'center' }}>
                Sem compromisso. Você decide depois de ver o sistema funcionando.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
