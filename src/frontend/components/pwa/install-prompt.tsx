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
    const [mounted, setMounted] = useState(false);

    // Solo mostrar en la página de login
    const shouldShowOnCurrentPage = pathname === '/login';

    useEffect(() => {
        setMounted(true);
        // Verificar si fue descartado previamente
        if (typeof window !== 'undefined') {
            const dismissed = sessionStorage.getItem('pwa-install-dismissed') === 'true';
            setIsDismissed(dismissed);
        }
    }, []);

    useEffect(() => {
        // Solo configurar el event listener si estamos en la página correcta y montado
        if (!shouldShowOnCurrentPage || !mounted || isDismissed) {
            setShowInstallPrompt(false);
            return;
        }

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event so it can be triggered later
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [shouldShowOnCurrentPage, mounted, isDismissed]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the saved prompt since it can't be used again
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        setIsDismissed(true);
        // Recordar que el usuario lo descartó por esta sesión
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pwa-install-dismissed', 'true');
        }
    };

    // No mostrar si no estamos en la página de login o no está montado
    if (!shouldShowOnCurrentPage || !mounted) return null;

    // No mostrar si ya fue descartado en esta sesión
    if (isDismissed) return null;

    if (!showInstallPrompt) return null;

    return (
        <>
            {/* Desktop version - bottom left corner */}
            <div className="hidden lg:block fixed bottom-4 left-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-5 animate-in slide-in-from-bottom-2">
                {/* X button in top right corner */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                
                <div className="flex items-start space-x-4 pr-8">
                    <div className="flex-shrink-0 mt-1">
                        <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            Instalar Lactokeeper
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            Instala la aplicación en tu dispositivo para tener una experiencia optimizada.
                        </p>
                        <Button
                            onClick={handleInstallClick}
                            size="sm"
                            className="w-full"
                        >
                            Instalar aplicación
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile and Tablet version - compact bottom banner */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg animate-in slide-in-from-bottom-2">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    Instalar Lactokeeper
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">
                                    Experiencia optimizada en tu dispositivo
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                            <Button
                                onClick={handleInstallClick}
                                size="sm"
                                className="text-xs px-3 py-1.5 h-auto"
                            >
                                Instalar
                            </Button>
                            <button
                                onClick={handleDismiss}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
