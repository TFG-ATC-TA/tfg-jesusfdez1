'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // FORZAR desregistro de TODOS los service workers anteriores
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('SW: Found', registrations.length, 'existing registrations');
        registrations.forEach(registration => {
          console.log('SW: Unregistering:', registration.scope);
          registration.unregister();
        });
      });

      // Esperar un poco y luego registrar el nuevo
      setTimeout(() => {
        navigator.serviceWorker.register('/custom-sw.js', {
          scope: '/',
          updateViaCache: 'none' // Importante: no cachear el SW
        })
          .then(registration => {
            console.log('SW: Service Worker registrado con éxito:', registration);
            
            // Forzar actualización inmediata si hay un worker esperando
            if (registration.waiting) {
              console.log('SW: Activating waiting worker immediately');
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Verificar actualizaciones manualmente
            registration.update().then(() => {
              console.log('SW: Manual update check completed');
            });
            
            // Escuchar nuevas instalaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                console.log('SW: New worker installing');
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    console.log('SW: New worker installed, activating immediately');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('SW: Error al registrar Service Worker:', error);
          });
      }, 100);

      // Escuchar cambios en el service worker activo
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('SW: Controller changed - nuevo Service Worker activo');
      });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
