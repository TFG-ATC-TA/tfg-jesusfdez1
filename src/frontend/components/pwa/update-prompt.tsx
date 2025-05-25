'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const pathname = usePathname();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Solo mostrar en la página de login
  const shouldShowOnCurrentPage = pathname === '/login';

  useEffect(() => {
    setMounted(true);
    // Verificar si fue descartado previamente
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('pwa-update-dismissed') === 'true';
      setIsDismissed(dismissed);
    }
  }, []);

  useEffect(() => {
    // Solo configurar el event listener si estamos en la página correcta y montado
    if (!shouldShowOnCurrentPage || !mounted || isDismissed) {
      setUpdateAvailable(false);
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      });

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [shouldShowOnCurrentPage, mounted, isDismissed]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // El service worker se actualizará y se recargará la página automáticamente
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setIsDismissed(true);
    // Recordar que el usuario lo descartó por esta sesión
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-update-dismissed', 'true');
    }
  };

  // No mostrar si no estamos en la página de login o no está montado
  if (!shouldShowOnCurrentPage || !mounted) return null;

  // No mostrar si ya fue descartado en esta sesión
  if (isDismissed) return null;

  // No mostrar si el install prompt está visible
  if (typeof window !== 'undefined') {
    const installPromptDismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
    if (!installPromptDismissed) return null; // No mostrar update si install está visible
  }

  if (!updateAvailable) return null;

  return (
    <>
      {/* Desktop version - bottom left corner */}
      <div className="hidden lg:block fixed bottom-4 left-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-5 animate-in slide-in-from-bottom-2">
        {/* X button in top right corner */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
        
        <div className="flex items-start space-x-4 pr-8">
          <div className="flex-shrink-0 mt-1">
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Actualización disponible
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Hay una nueva versión de la aplicación disponible.
            </p>
            <Button
              onClick={handleUpdate}
              size="sm"
              className="w-full"
            >
              Actualizar aplicación
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile and Tablet version - compact bottom banner */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg animate-in slide-in-from-bottom-2">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Actualización disponible
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">
                  Nueva versión de la aplicación disponible
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="text-xs px-3 py-1.5 h-auto"
              >
                Actualizar
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
