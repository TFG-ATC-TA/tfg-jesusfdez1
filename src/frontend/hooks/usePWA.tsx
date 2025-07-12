/**
 * Hook para funcionalidad de Progressive Web App (PWA)
 * Maneja el estado de instalación y modo standalone de la aplicación
 * Detecta características de PWA y proporciona información de estado
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar y manejar características de PWA
 * Detecta si la app está instalada, puede ser instalada o está en modo standalone
 * @returns Objeto con estado de PWA (standalone, instalable, etc.)
 */
export function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    /**
     * Verifica si la aplicación está ejecutándose en modo standalone
     * (instalada como app nativa)
     * Comprueba múltiples indicadores para compatibilidad cross-platform
     */
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    /**
     * Maneja el evento beforeinstallprompt
     * Se dispara cuando la app puede ser instalada
     * Permite mostrar prompts de instalación personalizados
     */
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    // Verificar estado inicial
    checkStandalone();
    
    // Escuchar evento de instalación
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    // Limpiar event listeners al desmontar
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  return {
    isStandalone,
    isInstallable,
    isPWA: isStandalone || isInstallable
  };
}
