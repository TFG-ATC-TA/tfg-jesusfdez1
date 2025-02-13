'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useEffect, useCallback, useRef } from 'react';

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  // Referencia para evitar múltiples aplicaciones
  const isInitializedRef = useRef(false);
  const priorityLoadAttemptedRef = useRef(false);

  // Función para cargar y aplicar el color primario
  const loadAndApplyPrimaryColor = useCallback(() => {
    try {
      const savedColor = localStorage.getItem('theme-primary-color');
      if (savedColor) {
        const { hue, saturation, lightness } = JSON.parse(savedColor);
        const hslValue = `${hue} ${saturation}% ${lightness}%`;
        
        // Aplicar el color a las variables CSS
        document.documentElement.style.setProperty('--primary', hslValue);
        document.documentElement.style.setProperty('--ring', hslValue);
        document.documentElement.style.setProperty('--primary-foreground', `${hue} ${saturation}% 98%`);
        
        // Actualizar también los valores para los gráficos basados en el color primario
        document.documentElement.style.setProperty('--chart-1', hslValue);
        document.documentElement.style.setProperty('--chart-2', `${(hue + 30) % 360} ${saturation}% ${lightness}%`);
        document.documentElement.style.setProperty('--chart-3', `${(hue + 60) % 360} ${saturation}% ${lightness}%`);
        document.documentElement.style.setProperty('--chart-4', `${(hue + 90) % 360} ${saturation}% ${lightness}%`);
        document.documentElement.style.setProperty('--chart-5', `${(hue + 120) % 360} ${saturation}% ${lightness}%`);
        
        // Disparar un evento para que otros componentes sepan que el color ha cambiado
        window.dispatchEvent(new CustomEvent('theme-color-changed', { detail: { hue, saturation, lightness } }));
        
        isInitializedRef.current = true;
        console.log('Color primario aplicado:', hslValue);
        return true;
      }
    } catch (error) {
      console.error('Error al cargar el color del tema:', error);
    }
    return false;
  }, []);

  // Función para cargar la preferencia de tema (claro/oscuro)
  const loadAndApplyThemePreference = useCallback(() => {
    try {
      const themePreference = localStorage.getItem('user-theme-preference');
      if (themePreference) {
        // No es necesario hacer nada aquí, next-themes maneja esto automáticamente
        console.log('Tema cargado:', themePreference);
      }
    } catch (error) {
      console.error('Error al cargar preferencia de tema:', error);
    }
  }, []);

  // Carga prioritaria - Este useEffect se ejecutará primero y una sola vez
  useEffect(() => {
    if (!priorityLoadAttemptedRef.current) {
      priorityLoadAttemptedRef.current = true;
      loadAndApplyPrimaryColor();
    }
  }, [loadAndApplyPrimaryColor]);

  // Configuración principal de eventos y cargas con retraso
  useEffect(() => {
    // Priorizar la carga del color al inicio
    if (!isInitializedRef.current) {
      loadAndApplyPrimaryColor();
    }

    // Manejar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-primary-color' || e.key === 'user-theme-preference') {
        loadAndApplyPrimaryColor();
        loadAndApplyThemePreference();
      }
    };

    // Para asegurarnos de que se aplique correctamente, ejecutamos con varios tiempos
    // Esto ayuda en situaciones donde otros scripts pueden interferir o la carga es lenta
    const applyPreferencesWithDelays = () => {
      // Inmediatamente 
      loadAndApplyThemePreference();
      loadAndApplyPrimaryColor();
      
      // Después de un breve retraso
      setTimeout(() => {
        loadAndApplyThemePreference();
        loadAndApplyPrimaryColor();
      }, 50);
      
      // Y con un retraso más largo para asegurar que todo esté listo
      setTimeout(() => {
        loadAndApplyThemePreference();
        loadAndApplyPrimaryColor();
      }, 300);
      
      // Un último intento con un retraso aún mayor
      setTimeout(() => {
        loadAndApplyThemePreference();
        loadAndApplyPrimaryColor();
      }, 1000);
    };

    // Aplicar las preferencias al cargar el componente
    applyPreferencesWithDelays();
    
    // También aplicar cuando cambia el localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Aplicar después de que el documento esté completamente cargado
    const handleLoad = () => {
      setTimeout(loadAndApplyPrimaryColor, 0);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }
    
    // Aplicar cuando la página se vuelve visible después de estar inactiva
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAndApplyPrimaryColor();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Recargar cuando el DOM ha sido manipulado (para ciertos frameworks)
    const mutationObserver = new MutationObserver((mutations) => {
      // Solo verificar mutaciones importantes que puedan afectar los estilos
      const significantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        (mutation.target === document.head || mutation.target === document.documentElement)
      );
      
      if (significantChanges) {
        loadAndApplyPrimaryColor();
      }
    });
    
    mutationObserver.observe(document.documentElement, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mutationObserver.disconnect();
    };
  }, [loadAndApplyPrimaryColor, loadAndApplyThemePreference]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
