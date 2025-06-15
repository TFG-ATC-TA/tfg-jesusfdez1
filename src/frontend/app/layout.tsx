import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import PWAWrapper from '@/components/pwa/pwa-wrapper';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionTimeoutProvider } from "@/providers/session-timeout-provider";

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lactokeeper" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
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