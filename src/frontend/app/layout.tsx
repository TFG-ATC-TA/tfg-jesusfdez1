/**
 * Layout principal de la aplicación
 * Define la estructura HTML base y metadatos para SEO y PWA
 * Incluye configuración de viewport, metadatos, iconos y estructura de providers
 */

import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import PWAWrapper from '@/components/pwa/pwa-wrapper';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionTimeoutProvider } from "@/providers/session-timeout-provider";

import './globals.css';

// Configuración de la fuente Inter para optimizar rendimiento y consistencia visual
const inter = Inter({ subsets: ['latin'] });

/**
 * Configuración del viewport para dispositivos móviles
 * Optimiza la visualización en diferentes tamaños de pantalla
 * Previene zoom no deseado y mejora la experiencia PWA
 */
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Metadatos de la aplicación para SEO y PWA
 * Incluye información para redes sociales, iconos y configuración de app
 * Optimiza el posicionamiento y la experiencia de instalación PWA
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://lactokeeper.com'),
  title: "Lactokeeper",
  description: "Visualización de datos del sector lácteo",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["lactokeeper", "sector lácteo", "datos", "visualización", "granjas", "dispositivos"],
  authors: [{ name: "Lactokeeper Team" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-128x128.png" },
    { rel: "icon", url: "/icon-128x128.png" },
  ],
  openGraph: {
    type: "website",
    siteName: "Lactokeeper",
    title: "Lactokeeper",
    description: "Visualización de datos del sector lácteo",
    url: "https://lactokeeper.com",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Lactokeeper Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lactokeeper",
    description: "Visualización de datos del sector lácteo",
    images: ["/icon-512x512.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Lactokeeper",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Lactokeeper",
    "apple-mobile-web-app-title": "Lactokeeper",
    "theme-color": "#000000",
    "msapplication-navbutton-color": "#000000",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

/**
 * Componente de layout raíz
 * Envuelve toda la aplicación con providers y configuración PWA
 * Estructura la aplicación con HTML semántico y metadatos optimizados
 * @param children - Componentes hijos de la aplicación
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags para PWA y configuración móvil */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lactokeeper" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Iconos y manifest para PWA */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {/* Providers para contexto global y PWA */}
        <Providers>
          <SessionTimeoutProvider>
            <PWAWrapper />
            {children}
            <Toaster />
          </SessionTimeoutProvider>
        </Providers>
      </body>
    </html>
  );
}