'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      // Opcional: recargar la página automáticamente cuando se restablezca la conexión
      // window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Check initial status
    setIsOnline(navigator.onLine);
    
    // Si está offline al cargar, mostrar mensaje inmediatamente
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      // Show "back online" message briefly
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      // Intentar hacer una petición HEAD a la raíz del sitio
      const response = await fetch('/', { 
        method: 'HEAD', 
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });
      
      if (response.ok) {
        setIsOnline(true);
        setShowOfflineMessage(false);
        // Recargar la página si la conexión está funcionando
        window.location.reload();
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.log('Connection check failed:', error);
      setIsOnline(false);
      setShowOfflineMessage(true);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  if (!showOfflineMessage && isOnline) return null;

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 rounded-lg shadow-lg p-3 animate-in slide-in-from-top-2 ${
      isOnline 
        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
        : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
    }`}>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <p className={`text-sm font-medium ${
            isOnline 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {isOnline ? 'Conectado a internet' : 'Sin conexión a internet'}
          </p>
        </div>
        
        {!isOnline && (
          <button
            onClick={checkConnection}
            disabled={isCheckingConnection}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isCheckingConnection ? 'animate-spin' : ''}`} />
            <span>{isCheckingConnection ? 'Verificando...' : 'Verificar'}</span>
          </button>
        )}
      </div>
      
      {!isOnline && (
        <div className="mt-2">
          <p className="text-xs text-red-600 dark:text-red-400">
            Esta aplicación requiere conexión a internet para funcionar
          </p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">
            Todas las funciones están deshabilitadas hasta que se restablezca la conexión
          </p>
        </div>
      )}
    </div>
  );
}
