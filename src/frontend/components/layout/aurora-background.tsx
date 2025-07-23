/**
 * Componente de fondo aurora con efectos visuales animados
 * Proporciona un fondo dinámico con gradientes radiales y animaciones
 * Incluye soporte para modo claro y oscuro con diferentes efectos
 */

"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode, useEffect, useState, useRef } from "react";

/**
 * Props del componente AuroraBackground
 */
interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Componente de fondo aurora con efectos visuales
 * Renderiza capas de gradientes animados con diferentes colores y opacidades
 * @param children - Contenido a renderizar sobre el fondo
 * @param showRadialGradient - Si mostrar gradiente radial adicional
 * @param className - Clases CSS adicionales
 * @param props - Props adicionales de HTML
 */
export const AuroraBackground = React.forwardRef<HTMLDivElement, AuroraBackgroundProps>(
  ({ children, showRadialGradient = false, className, ...props }, _ref) => {
    // Estado para el color principal del tema
    const [auroraColors, setAuroraColors] = useState({
      hue: 220,
      saturation: 80,
      lightness: 50
    });
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Obtención y actualización del color principal
    useEffect(() => {
      const updateFromLocalStorage = () => {
        try {
          const savedColor = localStorage.getItem('theme-primary-color');
          if (savedColor) {
            const { hue, saturation, lightness } = JSON.parse(savedColor);
            setAuroraColors({ 
              hue: parseInt(hue), 
              saturation: parseInt(saturation), 
              lightness: parseInt(lightness) 
            });
            initializedRef.current = true;
          } else {
            if (!initializedRef.current) {
              updateFromCSS();
            }
          }
        } catch (error) {
          if (!initializedRef.current) {
            updateFromCSS();
          }
        }
      };

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
        } catch (error) {}
      };

      // Secuencia de carga con varios intentos
      updateFromLocalStorage();
      const loadSequence = () => {
        updateFromLocalStorage();
        setTimeout(updateFromLocalStorage, 100);
        setTimeout(updateFromLocalStorage, 500);
        loadTimeoutRef.current = setTimeout(updateFromLocalStorage, 1500);
      };
      loadSequence();

      // Listeners para cambios de tema
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'theme-primary-color') {
          updateFromLocalStorage();
        }
      };
      const handleCustomThemeChange = (e: CustomEvent) => {
        if (e.detail && e.detail.hue !== undefined) {
          const { hue, saturation, lightness } = e.detail;
          setAuroraColors({ 
            hue: parseInt(hue), 
            saturation: parseInt(saturation), 
            lightness: parseInt(lightness) 
          });
        } else {
          updateFromLocalStorage();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('theme-color-changed', handleCustomThemeChange as EventListener);
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updateFromLocalStorage();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      const handleDOMLoaded = () => {
        updateFromLocalStorage();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDOMLoaded);
      }
      setMounted(true);
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
      let saturation = Math.max(baseSaturation, 50);
      let lightness = isLight 
        ? Math.min(Math.max(baseLightness + 15, 60), 85)
        : Math.min(Math.max(baseLightness - 15, 15), 40);
      return { hue, saturation, lightness };
    };

    // Generar colores con contraste garantizado para modo claro
    const light1 = getContrastColor(auroraColors.hue, auroraColors.saturation, auroraColors.lightness, true);
    const light2 = getContrastColor((auroraColors.hue + 15) % 360, auroraColors.saturation + 10, auroraColors.lightness, true);
    const light3 = getContrastColor((auroraColors.hue + 345) % 360, auroraColors.saturation + 5, auroraColors.lightness, true);
    const light4 = getContrastColor((auroraColors.hue + 30) % 360, auroraColors.saturation + 12, auroraColors.lightness, true);
    const light5 = getContrastColor((auroraColors.hue + 330) % 360, auroraColors.saturation + 8, auroraColors.lightness, true);

    // Generar colores con contraste garantizado para modo oscuro
    const dark1 = getContrastColor(auroraColors.hue, auroraColors.saturation, auroraColors.lightness, false);
    const dark2 = getContrastColor((auroraColors.hue + 15) % 360, auroraColors.saturation + 10, auroraColors.lightness, false);
    const dark3 = getContrastColor((auroraColors.hue + 345) % 360, auroraColors.saturation + 5, auroraColors.lightness, false);
    const dark4 = getContrastColor((auroraColors.hue + 30) % 360, auroraColors.saturation + 12, auroraColors.lightness, false);
    const dark5 = getContrastColor((auroraColors.hue + 330) % 360, auroraColors.saturation + 8, auroraColors.lightness, false);

    // Crear strings HSL para usar en los gradientes
    const lightColor1 = `hsl(${light1.hue}, ${light1.saturation}%, ${light1.lightness}%)`;
    const lightColor2 = `hsl(${light2.hue}, ${light2.saturation}%, ${light2.lightness}%)`;
    const lightColor3 = `hsl(${light3.hue}, ${light3.saturation}%, ${light3.lightness}%)`;
    const lightColor4 = `hsl(${light4.hue}, ${light4.saturation}%, ${light4.lightness}%)`;
    const lightColor5 = `hsl(${light5.hue}, ${light5.saturation}%, ${light5.lightness}%)`;

    const darkColor1 = `hsl(${dark1.hue}, ${dark1.saturation}%, ${dark1.lightness}%)`;
    const darkColor2 = `hsl(${dark2.hue}, ${dark2.saturation}%, ${dark2.lightness}%)`;
    const darkColor3 = `hsl(${dark3.hue}, ${dark3.saturation}%, ${dark3.lightness}%)`;
    const darkColor4 = `hsl(${dark4.hue}, ${dark4.saturation}%, ${dark4.lightness}%)`;
    const darkColor5 = `hsl(${dark5.hue}, ${dark5.saturation}%, ${dark5.lightness}%)`;

    if (!mounted) {
      return (
        <div className={cn("relative w-full h-full", className)} {...props}>
          {children}
        </div>
      );
    }

    return (
      <>
        {/* Contenedor del fondo aurora */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
        >
          {/* Efectos para modo claro */}
          <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-1000">
            {/* Primera capa de aurora */}
            <div 
              className="absolute inset-0 animate-aurora-flow-1 opacity-40"
              style={{
                backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${lightColor1}, transparent 70%)`,
                filter: 'blur(40px)'
              }}
            />
            {/* Segunda capa de aurora */}
            <div 
              className="absolute inset-0 animate-aurora-flow-2 opacity-40"
              style={{
                backgroundImage: `radial-gradient(ellipse 50% 80% at 90% 50%, ${lightColor2}, transparent 70%)`,
                filter: 'blur(45px)'
              }}
            />
            {/* Tercera capa de aurora */}
            <div 
              className="absolute inset-0 animate-aurora-flow-3 opacity-40"
              style={{
                backgroundImage: `radial-gradient(ellipse 50% 60% at 10% 70%, ${lightColor3}, transparent 70%)`,
                filter: 'blur(50px)'
              }}
            />
            {/* Cuarta capa de aurora */}
            <div 
              className="absolute inset-0 animate-aurora-flow-4 opacity-35"
              style={{
                backgroundImage: `radial-gradient(ellipse 70% 30% at 20% 20%, ${lightColor4}, transparent 70%)`,
                filter: 'blur(55px)'
              }}
            />
            {/* Quinta capa de aurora */}
            <div 
              className="absolute inset-0 animate-aurora-flow-5 opacity-30"
              style={{
                backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 80%, ${lightColor5}, transparent 70%)`,
                filter: 'blur(45px)'
              }}
            />
          </div>

          {/* Efectos para modo oscuro */}
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
            {/* Cuarta capa */}
            <div 
              className="absolute inset-0 animate-aurora-flow-4 opacity-25"
              style={{
                backgroundImage: `radial-gradient(ellipse 70% 30% at 20% 20%, ${darkColor4}, transparent 70%)`,
                filter: 'blur(55px)'
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
  }
);

AuroraBackground.displayName = "AuroraBackground";
