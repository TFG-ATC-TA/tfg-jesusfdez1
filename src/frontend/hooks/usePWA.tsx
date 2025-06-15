'use client';

import { useState, useEffect } from 'react';

export function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    checkStandalone();
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

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
