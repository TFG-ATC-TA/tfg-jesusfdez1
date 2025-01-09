'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/hooks/useUserContext';
import { SessionUpdateListener } from '@/components/layout/session-update-listener';

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
