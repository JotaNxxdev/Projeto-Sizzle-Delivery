import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './theme.css';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import BottomNav from '@/components/BottomNav';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sizzle | Delivery',
  description: 'Peça comida dos melhores restaurantes perto de você.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <ToastProvider>
          <ConfirmProvider>
            <CartProvider>
              <FavoritesProvider>
                <div id="app-container">{children}</div>
                <BottomNav />
              </FavoritesProvider>
            </CartProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
