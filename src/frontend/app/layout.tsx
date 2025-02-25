import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionTimeoutProvider } from "@/providers/session-timeout-provider";

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Lactokeeper",
  description: "Visualización de datos del sector lácteo",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <SessionTimeoutProvider>
            {children}
            <Toaster />
          </SessionTimeoutProvider>
        </Providers>
      </body>
    </html>
  );
}