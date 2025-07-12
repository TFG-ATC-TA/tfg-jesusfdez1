/**
 * Componente de prompt de actualización para Progressive Web App (PWA)
 * Maneja las actualizaciones de la aplicación cuando hay una nueva versión disponible
 * Se muestra solo cuando hay una actualización pendiente
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

/**
 * Componente que maneja el prompt de actualización de la PWA
 * Se muestra cuando hay una nueva versión de la aplicación disponible
 */
export default function UpdatePrompt() {
  const pathname = usePathname();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Solo mostrar en la página de login para no interferir con la experiencia principal
  const shouldShowOnCurrentPage = pathname === '/login';

  useEffect(() => {
    if (!shouldShowOnCurrentPage) {
      setUpdateAvailable(false);
      return;
    }

    // Verificar si fue descartado previamente para evitar spam
    const dismissed = sessionStorage.getItem('pwa-update-dismissed') === 'true';
    setIsDismissed(dismissed);

    if (dismissed) return;

    // No mostrar update si install prompt está visible para evitar conflictos
    const installPromptDismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
    if (!installPromptDismissed) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          
          // Escuchar cuando se encuentra una nueva versión del service worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // Mostrar prompt cuando hay una nueva versión instalada y hay un controlador activo
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      });

      // Recargar la página cuando el nuevo service worker tome control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [shouldShowOnCurrentPage]);

  /**
   * Maneja la actualización de la aplicación
   * Envía mensaje al service worker para activar la nueva versión
   */
  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  };

  /**
   * Maneja el descarte del prompt de actualización
   * Guarda el estado en sessionStorage para evitar mostrar de nuevo
   */
  const handleDismiss = () => {
    setUpdateAvailable(false);
    setIsDismissed(true);
    sessionStorage.setItem('pwa-update-dismissed', 'true');
  };

  if (!shouldShowOnCurrentPage || isDismissed || !updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:max-w-sm z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      
      <div className="flex items-start space-x-3 pr-6">
        <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Actualización disponible
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Hay una nueva versión de la aplicación disponible.
          </p>
          <Button
            onClick={handleUpdate}
            size="sm"
            className="w-full text-xs"
          >
            Actualizar aplicación
          </Button>
        </div>
      </div>
    </div>
  );
}
