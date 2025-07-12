/**
 * Proveedores de contexto global para la aplicación
 * Configura todos los providers necesarios para el funcionamiento de la app
 */

'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/hooks/useUserContext';
import { SessionUpdateListener } from '@/components/layout/session-update-listener';

/**
 * Componente que envuelve toda la aplicación con los providers necesarios
 * Proporciona contexto para temas, sesiones, usuarios y actualizaciones
 * @param children - Componentes hijos que tendrán acceso a todos los contextos
 */
export default function Providers({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <UserProvider>
          <SessionUpdateListener />
          {children}
        </UserProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
