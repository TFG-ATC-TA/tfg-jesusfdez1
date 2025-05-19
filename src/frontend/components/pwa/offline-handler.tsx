'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflineHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleOffline = () => {
      // Si estamos offline y no estamos ya en la página offline, redirigir
      if (!window.location.pathname.includes('/offline')) {
        router.push('/offline');
      }
    };

    const handleOnline = () => {
      // Si volvemos online y estamos en la página offline, volver al inicio
      if (window.location.pathname.includes('/offline')) {
        router.push('/');
      }
    };

    // Verificar estado inicial
    if (!navigator.onLine && !window.location.pathname.includes('/offline')) {
      router.push('/offline');
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [router]);

  return null; // Este componente no renderiza nada visible
}
