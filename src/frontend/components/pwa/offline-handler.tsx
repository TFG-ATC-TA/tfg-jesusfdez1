/**
 * Componente de manejo de estado offline para PWA
 * Detecta cuando la aplicación está offline y maneja la conectividad del servidor
 * Proporciona funcionalidad offline y redirección cuando es necesario
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Componente que maneja el estado offline de la aplicación
 * No renderiza nada visible, solo maneja la lógica de conectividad
 */
export default function OfflineHandler() {
  const router = useRouter();
  const [_serverAvailable, setServerAvailable] = useState(true);

  useEffect(() => {
    /**
     * Verifica la conectividad con el servidor
     * Realiza una petición HEAD para determinar si el servidor está disponible
     */
    const checkServerConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Si recibimos cualquier respuesta del servidor Next.js, está disponible
        if (response.ok || response.status === 401 || response.status === 403 || response.status === 404) {
          setServerAvailable(true);
          
          // Si el servidor está disponible y estamos en offline, redirigir al inicio
          if (window.location.pathname === '/offline') {
            router.push('/');
          }
        } else {
          setServerAvailable(false);
        }
      } catch (_error) {
        setServerAvailable(false);
        
        // Si el servidor no está disponible, forzar recarga para que el service worker maneje la situación
        if (window.location.pathname !== '/offline.html') {
          // El service worker debería interceptar esto y servir offline.html
          window.location.href = '/offline.html';
        }
      }
    };

    /**
     * Maneja el evento de desconexión del navegador
     * Se dispara cuando el dispositivo pierde conectividad
     */
    const handleOffline = () => {
      setServerAvailable(false);
      // Cuando se detecta offline, el service worker debería manejar las peticiones
      logger.log('OfflineHandler: Browser offline detected');
    };

    /**
     * Maneja el evento de reconexión del navegador
     * Verifica la conectividad del servidor cuando vuelve a estar online
     */
    const handleOnline = () => {
      // Cuando volvemos online, verificar si el servidor está disponible
      logger.log('OfflineHandler: Browser online detected, checking server...');
      setTimeout(checkServerConnection, 1000);
    };

    /**
     * Maneja cambios en la visibilidad de la página
     * Verifica la conexión cuando la página vuelve a estar visible
     */
    const handleVisibilityChange = () => {
      // Verificar conexión cuando la página vuelve a estar visible
      if (!document.hidden && navigator.onLine) {
        checkServerConnection();
      }
    };

    // Verificar estado inicial de conectividad
    if (!navigator.onLine) {
      handleOffline();
    } else {
      // Verificar conexión del servidor si hay internet
      checkServerConnection();
    }

    // Solo verificar periódicamente si no estamos en la página offline estática
    let serverCheckInterval: NodeJS.Timeout | null = null;
    if (!window.location.pathname.includes('offline.html')) {
      serverCheckInterval = setInterval(checkServerConnection, 30000); // cada 30 segundos
    }

    // Registrar event listeners para cambios de conectividad
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar event listeners al desmontar el componente
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (serverCheckInterval) {
        clearInterval(serverCheckInterval);
      }
    };
  }, [router]);

  return null; // Este componente no renderiza nada visible
}
