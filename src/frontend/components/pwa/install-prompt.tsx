'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export default function PWAInstallPrompt() {
    const pathname = usePathname();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Solo mostrar en la página de login
    const shouldShowOnCurrentPage = pathname === '/login';

    useEffect(() => {
        // Detectar si es móvil
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

        // Verificar si fue descartado previamente
        const dismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
        setIsDismissed(dismissed);

        if (dismissed) return;

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [shouldShowOnCurrentPage]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        logger.log(`PWA install prompt: ${outcome}`);
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        setIsDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!shouldShowOnCurrentPage || isDismissed || !showInstallPrompt) return null;

    // Diseño para móviles (footer simple)
    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
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

    // Diseño para escritorio (popup lateral)
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
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
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
