'use client';

import { useEffect } from 'react';

// Componente para garantizar que los colores personalizados se apliquen en la página de login
export default function ThemeColorLoader() {
  useEffect(() => {
    const applyThemeColor = () => {
      try {
        const savedColor = localStorage.getItem('theme-primary-color');
        if (savedColor) {
          const { hue, saturation, lightness } = JSON.parse(savedColor);
          const hslValue = `${hue} ${saturation}% ${lightness}%`;
          
          document.documentElement.style.setProperty('--primary', hslValue);
          document.documentElement.style.setProperty('--ring', hslValue);
          document.documentElement.style.setProperty('--primary-foreground', `${hue} ${saturation}% 98%`);
        }
      } catch (error) {
        console.error('Error al aplicar color del tema en login:', error);
      }
    };

    // Aplicar al montar el componente
    applyThemeColor();
    
    // Aplicar también cuando el documento esté completamente cargado
    if (document.readyState === 'complete') {
      applyThemeColor();
    } else {
      window.addEventListener('load', applyThemeColor);
      return () => window.removeEventListener('load', applyThemeColor);
    }
  }, []);

  return null; // Este componente no renderiza nada
}