/**
 * Componente de registro de Service Worker para PWA
 * Maneja el registro, actualización y gestión del service worker
 * Proporciona funcionalidad offline y cache para la aplicación
 */

'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Componente que registra y gestiona el service worker
 * No renderiza nada visible, solo maneja la lógica de service worker
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Limpiar registros antiguos primero para evitar conflictos
      navigator.serviceWorker.getRegistrations().then(registrations => {
        logger.log('SW: Found', registrations.length, 'existing registrations');
        registrations.forEach(registration => {
          logger.log('SW: Unregistering:', registration.scope);
          registration.unregister();
        });

        // Esperar un poco y luego registrar el nuevo service worker
        setTimeout(() => {
          navigator.serviceWorker.register('/custom-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Forzar actualización inmediata
          })
            .then((registration) => {
              logger.log('SW: Service Worker registrado con éxito:', registration);
              
              // Forzar actualización inmediata si hay un worker esperando
              if (registration.waiting) {
                logger.log('SW: Activating waiting worker immediately');
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              
              // Verificar actualizaciones manualmente
              registration.update().then(() => {
                logger.log('SW: Manual update check completed');
              });
              
              // Escuchar nuevas instalaciones de service worker
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  logger.log('SW: New worker installing');
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed') {
                      logger.log('SW: New worker installed, activating immediately');
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  });
                }
              });

              // Verificar si el service worker está activo y listo
              if (registration.active) {
                logger.log('SW: Service worker is active and ready');
              }
            })
            .catch(error => {
              console.error('SW: Error al registrar Service Worker:', error);
            });
        }, 500);
      });

      // Escuchar cambios en el service worker activo
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.log('SW: Controller changed - nuevo Service Worker activo');
        // Recargar la página cuando el nuevo service worker tome control
        window.location.reload();
      });

      // Escuchar mensajes del service worker para debugging
      navigator.serviceWorker.addEventListener('message', event => {
        logger.log('SW: Message received from service worker:', event.data);
      });
    } else {
      console.warn('SW: Service Worker no soportado en este navegador');
    }
  }, []);

  return null; // Este componente no renderiza nada visible
}
