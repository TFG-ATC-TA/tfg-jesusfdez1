'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

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

    // Solo mostrar en la página de login
    const shouldShowOnCurrentPage = pathname === '/login';

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
        
        console.log(`PWA install prompt: ${outcome}`);
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        setIsDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!shouldShowOnCurrentPage || isDismissed || !showInstallPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:max-w-sm z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2">
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
