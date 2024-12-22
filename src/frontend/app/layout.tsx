<<<<<<< Updated upstream
'use client'

import { ScrollArea } from '@/components/ui/scroll-area'

export default function AuthenticationPage() {
  return (
    <html>
      <body>
        <ScrollArea className="h-screen w-full">
          <div className="relative min-h-screen flex items-center justify-center lg:justify-end bg-background">

            <div className="relative z-10 w-full max-w-md mx-4 my-8 p-6 bg-background/95 dark:bg-background/90 rounded-lg shadow-xl lg:mx-0 lg:my-0 lg:mr-24">
              <div className="flex items-center justify-center mb-6">
                <span className="font-bold text-xl text-foreground">LactoKeeper</span>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Esto es una prueba hecha con NextJS
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </body>
    </html>
  )
=======
import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

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
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
>>>>>>> Stashed changes
}