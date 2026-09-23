'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Restaurant } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const CATEGORIES = [
  { id: 'pizza', label: 'Pizzas', icon: 'fa-pizza-slice' },
  { id: 'lanches', label: 'Lanches', icon: 'fa-burger' },
  { id: 'japonesa', label: 'Japonesa', icon: 'fa-fish' },
  { id: 'brasileira', label: 'Brasileira', icon: 'fa-utensils' },
];

export default function HomeClient({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const scrollSpeed = 0.6;
    const intervalTime = 20;
    const id = setInterval(() => {
      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
        carousel.scrollLeft = 0;
      } else {
        carousel.scrollLeft += scrollSpeed;
      }
    }, intervalTime);

    return () => clearInterval(id);
  }, []);

  const filteredRestaurants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesCategory = !activeCategory || restaurant.category === activeCategory;
      const matchesSearch =
        !term ||
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.category.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [restaurants, search, activeCategory]);

  function toggleCategory(categoryId: string) {
    setActiveCategory((prev) => (prev === categoryId ? null : categoryId));
  }

  return (
    <div className="screen">
      <header className="app-header">
        <div className="header-top">
          <img src="/LOGOR.png" alt="Sizzle Logo" className="sizzle-logo-header" />
          <i className="fas fa-map-marker-alt location-icon" aria-hidden="true" />
        </div>
        <div className="search-bar-container">
          <i className="fas fa-search search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-bar"
            placeholder="Buscar por restaurante ou prato..."
            aria-label="Buscar por restaurante ou prato"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </header>

      <main className="app-main">
        <section className="category-list">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={`category-item${activeCategory === category.id ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={activeCategory === category.id}
              onClick={() => toggleCategory(category.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleCategory(category.id);
                }
              }}
            >
              <div className="category-icon-container">
                <i className={`fas ${category.icon} category-icon`} aria-hidden="true" />
              </div>
              <span>{category.label}</span>
            </div>
          ))}
        </section>

        <section className="highlight-section">
          <h2>Destaques para você</h2>
          <div className="highlight-carousel" ref={carouselRef}>
            <div className="highlight-card">
              <img src="/promocao.png" alt="Promoção: 2 hambúrgueres por R$ 35,00" />
              <p className="highlight-text">2 Hambúrgueres por R$ 35,00!</p>
            </div>
            <div className="highlight-card">
              <img src="/Entrega-Gratis.png" alt="Entrega grátis para pedidos acima de R$ 50" />
              <p className="highlight-text">Entrega Grátis para pedidos acima de R$ 50!</p>
            </div>
            <div className="highlight-card">
              <img src="/promocao.png" alt="Promoção: 2 hambúrgueres por R$ 35,00" />
              <p className="highlight-text">2 Hambúrgueres por R$ 35,00!</p>
            </div>
            <div className="highlight-card">
              <img src="/Entrega-Gratis.png" alt="Entrega grátis para pedidos acima de R$ 50" />
              <p className="highlight-text">Entrega Grátis para pedidos acima de R$ 50!</p>
            </div>
          </div>
        </section>

        <section className="restaurant-list">
          <h2>Restaurantes Próximos</h2>
          <div className="restaurant-grid">
            {filteredRestaurants.length === 0 ? (
              <p className="empty-state">Nenhum restaurante encontrado.</p>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="restaurant-card"
                  style={!restaurant.isOpenNow ? { opacity: 0.6 } : undefined}
                >
                  <img src={restaurant.image} alt={restaurant.name} />
                  <div className="card-info">
                    <h3>
                      {restaurant.name}
                      {!restaurant.isOpenNow && (
                        <span style={{ color: '#F26666', fontWeight: 600, fontSize: '0.8rem' }}> (Fechado)</span>
                      )}
                    </h3>
                    <p className="details">
                      <i className="fas fa-star rating-icon" aria-hidden="true" /> {restaurant.rating} •{' '}
                      {restaurant.deliveryTime} •{' '}
                      {restaurant.deliveryFee > 0 ? formatCurrency(restaurant.deliveryFee) : 'Entrega grátis'}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
