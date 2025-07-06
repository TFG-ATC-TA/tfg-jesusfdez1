'use client'

import { useSession } from "next-auth/react"
import { useEffect, useState } from 'react'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import ThemeColorLoader from '@/components/layout/theme-color-loader'
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [serverUnavailable, setServerUnavailable] = useState(false)

  useEffect(() => {
    const checkServerAvailability = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        // Si el servidor responde, aunque sea con error, está disponible
        setServerUnavailable(false);
      } catch (error) {
        console.error('Server unavailable:', error);
        // Si no puede conectar con el servidor, redirigir a página offline estática
        setServerUnavailable(true);
        window.location.href = '/offline.html';
        return;
      }
    };

    if (status === 'unauthenticated') {
      // Verificar si es porque el servidor no está disponible
      checkServerAvailability();
    }
  }, [status])

  // Si el servidor no está disponible, no mostrar nada (se redirigirá a offline.html)
  if (serverUnavailable) {
    return null;
  }

  // Si no hay sesión pero el servidor está disponible, también no mostrar nada
  if (!session && status !== 'loading') {
    return null;
  }

  // Si aún está cargando, mostrar un spinner
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando Lactokeeper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <ThemeColorLoader />
      <div className={cn('hidden lg:block')}>
        <Sidebar />
      </div>
      <main className="w-full flex-1 overflow-hidden p-5 sm:p-0 lg:mb-0 lg:mx-4 md:mx-4">
        <Header />
        {children}
      </main>
      <div className={cn('lg:hidden z-50')}>
        <MobileSidebar />
      </div>
    </div>
  )
}