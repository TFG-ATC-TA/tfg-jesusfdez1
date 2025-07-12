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
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Asegurar que el componente se ejecute solo en el cliente
    useEffect(() => {
      setMounted(true);
    }, []);

    // Colores para modo claro
    const lightColor1 = 'hsl(200, 100%, 80%)';
    const lightColor2 = 'hsl(220, 100%, 85%)';
    const lightColor3 = 'hsl(240, 100%, 90%)';
    const lightColor4 = 'hsl(260, 100%, 85%)';
    const lightColor5 = 'hsl(280, 100%, 80%)';

    // Colores para modo oscuro
    const darkColor1 = 'hsl(200, 100%, 20%)';
    const darkColor2 = 'hsl(220, 100%, 25%)';
    const darkColor3 = 'hsl(240, 100%, 30%)';
    const darkColor4 = 'hsl(260, 100%, 25%)';
    const darkColor5 = 'hsl(280, 100%, 20%)';

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
