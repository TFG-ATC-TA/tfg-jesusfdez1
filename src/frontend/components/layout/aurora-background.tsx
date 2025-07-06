"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode, useEffect, useState, useRef } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const [auroraColors, setAuroraColors] = useState({
    hue: 220,
    saturation: 80,
    lightness: 50
  });
  
  // Referencia para controlar si ya hemos inicializado los colores
  const initializedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Función para obtener el color primario directamente del localStorage
    const updateFromLocalStorage = () => {
      try {
        const savedColor = localStorage.getItem('theme-primary-color');
        if (savedColor) {
          const { hue, saturation, lightness } = JSON.parse(savedColor);
          
          // Aplicar directamente los valores exactos del localStorage
          setAuroraColors({ 
            hue: parseInt(hue), 
            saturation: parseInt(saturation), 
            lightness: parseInt(lightness) 
          });
          
          initializedRef.current = true;
          console.log('Aurora actualizada con color:', { hue, saturation, lightness });
        } else {
          // Si no hay color guardado, intentar obtenerlo de CSS
          if (!initializedRef.current) {
            updateFromCSS();
          }
        }
      } catch (error) {
        console.error('Error al obtener color del localStorage:', error);
        // Fallback a CSS si hay error
        if (!initializedRef.current) {
          updateFromCSS();
        }
      }
    };

    // Función para obtener el color primario de las variables CSS
    const updateFromCSS = () => {
      try {
        const primaryStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
        if (!primaryStyle) return;

        const parts = primaryStyle.split(' ');
        if (parts.length < 3) return;

        const hue = parseInt(parts[0].replace('%', ''));
        const saturation = parseInt(parts[1].replace('%', ''));
        const lightness = parseInt(parts[2].replace('%', ''));

        if (isNaN(hue) || isNaN(saturation) || isNaN(lightness)) return;

        setAuroraColors({ hue, saturation, lightness });
        initializedRef.current = true;
      } catch (error) {
        console.error('Error al obtener color de CSS:', error);
      }
    };

    // Secuencia de carga con varios intentos
    // Intentar cargar el color inmediatamente
    updateFromLocalStorage();

    // Múltiples intentos con tiempos diferentes para garantizar la carga
    const loadSequence = () => {
      // Primer intento inmediato
      updateFromLocalStorage();
      
      // Segundo intento tras un breve retraso
      setTimeout(updateFromLocalStorage, 100);
      
      // Tercer intento después de que otros componentes hayan cargado
      setTimeout(updateFromLocalStorage, 500);
      
      // Un intento final
      loadTimeoutRef.current = setTimeout(updateFromLocalStorage, 1500);
    };
    
    loadSequence();

    // Escuchar cambios en el localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-primary-color') {
        updateFromLocalStorage();
      }
    };

    // Escuchar el evento personalizado para cambios de color del tema
    const handleCustomThemeChange = (e: CustomEvent) => {
      // Si el evento tiene detalles con los valores de color, usarlos directamente
      if (e.detail && e.detail.hue !== undefined) {
        const { hue, saturation, lightness } = e.detail;
        setAuroraColors({ 
          hue: parseInt(hue), 
          saturation: parseInt(saturation), 
          lightness: parseInt(lightness) 
        });
        console.log('Aurora actualizada desde evento personalizado:', { hue, saturation, lightness });
      } else {
        // Si no tiene detalles, intentar obtener del localStorage
        updateFromLocalStorage();
      }
    };

    // Registrar los event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-color-changed', handleCustomThemeChange as EventListener);
    
    // También recargar cuando la página se vuelve visible de nuevo
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateFromLocalStorage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Escuchar el evento DOMContentLoaded para garantizar que se aplique el color
    const handleDOMLoaded = () => {
      updateFromLocalStorage();
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMLoaded);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-color-changed', handleCustomThemeChange as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('DOMContentLoaded', handleDOMLoaded);
    };
  }, []);

  // Función para calcular un color con contraste garantizado
  const getContrastColor = (hue: number, baseSaturation: number, baseLightness: number, isLight: boolean) => {
    // Ajustar la saturación para colores con poco contraste
    const saturation = Math.max(baseSaturation, 50); // Mínimo 50% de saturación
    
    // Ajustar la luminosidad según modo claro/oscuro
    const lightness = isLight 
      ? Math.min(Math.max(baseLightness + 15, 60), 85) // Entre 60% y 85% para modo claro
      : Math.min(Math.max(baseLightness - 15, 15), 40); // Entre 15% y 40% para modo oscuro
    
    return { hue, saturation, lightness };
  };

  // Generar colores con contraste garantizado para modo claro
  const light1 = getContrastColor(auroraColors.hue, auroraColors.saturation, auroraColors.lightness, true);
  const light2 = getContrastColor((auroraColors.hue + 15) % 360, auroraColors.saturation + 10, auroraColors.lightness, true);
  const light3 = getContrastColor((auroraColors.hue + 345) % 360, auroraColors.saturation + 5, auroraColors.lightness, true);
  // Colores adicionales para más variedad en las capas
  const light5 = getContrastColor((auroraColors.hue + 330) % 360, auroraColors.saturation + 8, auroraColors.lightness, true);

  // Generar colores con contraste garantizado para modo oscuro
  const dark1 = getContrastColor(auroraColors.hue, auroraColors.saturation, auroraColors.lightness, false);
  const dark2 = getContrastColor((auroraColors.hue + 15) % 360, auroraColors.saturation + 10, auroraColors.lightness, false);
  const dark3 = getContrastColor((auroraColors.hue + 345) % 360, auroraColors.saturation + 5, auroraColors.lightness, false);
  // Colores adicionales para más variedad en las capas
  const dark5 = getContrastColor((auroraColors.hue + 330) % 360, auroraColors.saturation + 8, auroraColors.lightness, false);

  // Crear strings HSL para usar en los gradientes
  const lightColor1 = `hsl(${light1.hue}, ${light1.saturation}%, ${light1.lightness}%)`;
  const lightColor2 = `hsl(${light2.hue}, ${light2.saturation}%, ${light2.lightness}%)`;
  const lightColor3 = `hsl(${light3.hue}, ${light3.saturation}%, ${light3.lightness}%)`;
  const lightColor5 = `hsl(${light5.hue}, ${light5.saturation}%, ${light5.lightness}%)`;

  const darkColor1 = `hsl(${dark1.hue}, ${dark1.saturation}%, ${dark1.lightness}%)`;
  const darkColor2 = `hsl(${dark2.hue}, ${dark2.saturation}%, ${dark2.lightness}%)`;
  const darkColor3 = `hsl(${dark3.hue}, ${dark3.saturation}%, ${dark3.lightness}%)`;
  const darkColor5 = `hsl(${dark5.hue}, ${dark5.saturation}%, ${dark5.lightness}%)`;

  return (
    <>
      {/* Auroras como fondo absoluto, completamente separadas del contenido */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Auroras para modo claro - múltiples capas con animaciones diferentes */}
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-1000">
          {/* Primera capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-1 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${lightColor1}, transparent 70%)`,
              filter: 'blur(40px)'
            }}
          />
          
          {/* Segunda capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-2 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 50% 80% at 90% 50%, ${lightColor2}, transparent 70%)`,
              filter: 'blur(45px)'
            }}
          />
          
          {/* Tercera capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-3 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 50% 60% at 10% 70%, ${lightColor3}, transparent 70%)`,
              filter: 'blur(50px)'
            }}
          />
          

          
          {/* Quinta capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-5 opacity-25"
            style={{
              backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 80%, ${lightColor5}, transparent 70%)`,
              filter: 'blur(45px)'
            }}
          />
        </div>

        {/* Auroras para modo oscuro - múltiples capas con animaciones diferentes */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-1000">
          {/* Primera capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-1 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${darkColor1}, transparent 70%)`,
              filter: 'blur(40px)'
            }}
          />
          
          {/* Segunda capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-2 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 50% 80% at 90% 50%, ${darkColor2}, transparent 70%)`,
              filter: 'blur(45px)'
            }}
          />
          
          {/* Tercera capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-3 opacity-30"
            style={{
              backgroundImage: `radial-gradient(ellipse 50% 60% at 10% 70%, ${darkColor3}, transparent 70%)`,
              filter: 'blur(50px)'
            }}
          />

          
          {/* Quinta capa */}
          <div 
            className="absolute inset-0 animate-aurora-flow-5 opacity-25"
            style={{
              backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 80%, ${darkColor5}, transparent 70%)`,
              filter: 'blur(45px)'
            }}
          />
        </div>

        {/* Máscara radial (opcional) */}
        {showRadialGradient && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background dark:to-background" />
        )}
      </div>

      {/* Contenido - COMPLETAMENTE SEPARADO de las auroras */}
      <div
        className={cn(
          "relative w-full h-full flex flex-col items-center justify-start bg-transparent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
};
