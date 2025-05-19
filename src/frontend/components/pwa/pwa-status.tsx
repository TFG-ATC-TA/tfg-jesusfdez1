'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe } from 'lucide-react';

export default function PWAStatus() {
    const [isInstalled, setIsInstalled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Verificar si la PWA está instalada
        const checkInstalled = () => {
            return window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');
        };

        setIsInstalled(checkInstalled());
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex items-center space-x-2">
            {isInstalled ? (
                <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                >
                    <Smartphone className="h-3 w-3 mr-1" />
                    App
                </Badge>
            ) : (
                <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                    <Globe className="h-3 w-3 mr-1" />
                    Web
                </Badge>
            )}
        </div>
    );
}
