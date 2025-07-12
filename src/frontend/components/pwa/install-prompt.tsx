/**
 * Componente de prompt de instalación para Progressive Web App (PWA)
 * Maneja la instalación de la aplicación en dispositivos móviles y de escritorio
 * Incluye detección de dispositivos y gestión de estado de instalación
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Interfaz para el evento beforeinstallprompt
 * Define la estructura del evento de instalación de PWA
 */
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

/**
 * Declaración global para el evento beforeinstallprompt
 */
declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

/**
 * Componente que maneja el prompt de instalación de la PWA
 * Se muestra cuando la aplicación puede ser instalada como app nativa
 */
export default function PWAInstallPrompt() {
    const pathname = usePathname();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Solo mostrar en la página de login para no interferir con la experiencia principal
    const shouldShowOnCurrentPage = pathname === '/login';

    useEffect(() => {
        /**
         * Detecta si el dispositivo es móvil basándose en el ancho de pantalla
         */
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, [pathname]);

    useEffect(() => {
        if (!shouldShowOnCurrentPage) {
            setShowInstallPrompt(false);
            return;
        }

        // Verificar si fue descartado previamente para evitar spam
        const dismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
        setIsDismissed(dismissed);

        if (dismissed) return;

        /**
         * Maneja el evento beforeinstallprompt
         * Se dispara cuando la aplicación puede ser instalada
         */
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [shouldShowOnCurrentPage]);

    /**
     * Maneja el clic en el botón de instalación
     * Ejecuta el prompt nativo de instalación
     */
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        logger.log(`PWA install prompt: ${outcome}`);
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    /**
     * Maneja el descarte del prompt
     * Guarda el estado en sessionStorage para evitar mostrar de nuevo
     */
    const handleDismiss = () => {
        setShowInstallPrompt(false);
        setIsDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!shouldShowOnCurrentPage || isDismissed || !showInstallPrompt) return null;

    // Diseño para móviles (footer simple y compacto)
    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Download className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                Instalar Lactokeeper
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                        <Button
                            onClick={handleInstallClick}
                            size="sm"
                            className="text-xs px-3 py-1"
                        >
                            Instalar
                        </Button>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Diseño para escritorio (popup lateral con más información)
    return (
        <div className="fixed bottom-4 left-4 max-w-sm z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            <div className="flex items-start space-x-3 pr-6">
                <Download className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Instalar Lactokeeper
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                        Instala la aplicación para una experiencia optimizada.
                    </p>
                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="w-full text-xs"
                    >
                        Instalar aplicación
                    </Button>
                </div>
            </div>
        </div>
    );
}
