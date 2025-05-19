'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Registrar el service worker personalizado (funciona en dev y prod)
      navigator.serviceWorker.register('/custom-sw.js')
        .then(registration => {
          console.log('SW: Service Worker registrado con éxito:', registration);
          
          // Activar inmediatamente si hay uno en espera
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch(error => {
          console.error('SW: Error al registrar Service Worker:', error);
        });

      // Escuchar actualizaciones del service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('SW: Service Worker actualizado');
        // Opcional: recargar la página cuando se actualice el SW
        // window.location.reload();
      });

      // Forzar la activación del service worker
      navigator.serviceWorker.ready.then(registration => {
        console.log('SW: Service Worker listo');
        if (registration.active) {
          registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
        }
      });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
