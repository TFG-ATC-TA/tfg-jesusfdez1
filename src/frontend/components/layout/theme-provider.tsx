'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useEffect } from 'react';

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  // Cargar y aplicar el color primario guardado al iniciar la aplicación
  useEffect(() => {
    // Intentar cargar el tema (claro/oscuro/sistema) desde localStorage si existe
    const loadAndApplyThemePreference = () => {
      try {
        const themePreference = localStorage.getItem('user-theme-preference');
        if (themePreference) {
          // No es necesario hacer nada aquí, next-themes maneja esto automáticamente
          console.log('Tema cargado:', themePreference);
        }
      } catch (error) {
        console.error('Error al cargar preferencia de tema:', error);
      }
    };

    // Cargar y aplicar el color primario personalizado
    const loadAndApplyPrimaryColor = () => {
      try {
        const savedColor = localStorage.getItem('theme-primary-color');
        if (savedColor) {
          const { hue, saturation, lightness } = JSON.parse(savedColor);
          const hslValue = `${hue} ${saturation}% ${lightness}%`;
          
          // Aplicar el color a las variables CSS
          document.documentElement.style.setProperty('--primary', hslValue);
          document.documentElement.style.setProperty('--ring', hslValue);
          document.documentElement.style.setProperty('--primary-foreground', `${hue} ${saturation}% 98%`);
          
          console.log('Color primario aplicado:', hslValue);
        }
      } catch (error) {
        console.error('Error al cargar el color del tema:', error);
      }
    };

    // Evento para asegurar que las preferencias se apliquen incluso después de cargar
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-primary-color' || e.key === 'user-theme-preference') {
        loadAndApplyPrimaryColor();
      }
    };

    // Para asegurarnos de que se aplique correctamente, ejecutamos con un pequeño retraso
    // Esto ayuda en situaciones donde otros scripts pueden interferir
    const applyPreferencesWithDelay = () => {
      setTimeout(() => {
        loadAndApplyThemePreference();
        loadAndApplyPrimaryColor();
      }, 50);
    };

    // Aplicar las preferencias al cargar el componente
    applyPreferencesWithDelay();
    
    // También aplicar cuando cambia el localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Aplicar después de que el documento esté completamente cargado
    if (document.readyState === 'complete') {
      applyPreferencesWithDelay();
    } else {
      window.addEventListener('load', applyPreferencesWithDelay);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('load', applyPreferencesWithDelay);
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
