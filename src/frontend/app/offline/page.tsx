'use client';

import { useState, useEffect } from 'react';

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      // Intentar hacer una petición a los archivos estáticos de Next.js
      const response = await fetch('/_next/static/', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // Si hay respuesta, el servidor está disponible
      window.location.reload();
    } catch (error) {
      // Si falla la petición, aún no hay conexión con el servidor
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-gray-600 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM8.25 8.25h7.5v7.5h-7.5v-7.5z"
              />
            </svg>
          </div>
        </div>
        
        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Aplicación no disponible
        </h1>
        
        {/* Descripción */}
        <p className="text-gray-600 dark:text-gray-300">
          Lactokeeper requiere conexión a internet para funcionar correctamente. 
          Por favor, verifica tu conexión y vuelve a intentarlo.
        </p>
        
        {/* Advertencia */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Nota:</strong> Esta aplicación gestiona datos en tiempo real del sector lácteo 
            y requiere una conexión estable a internet para mostrar información actualizada.
          </p>
        </div>
        
        {/* Indicador de estado de conexión */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isOnline ? 'Conexión a internet detectada' : 'Sin conexión a internet'}
          </span>
        </div>
        
        {/* Botón de verificación */}
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
        >
          {isChecking ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Verificando conexión...</span>
            </div>
          ) : (
            'Verificar conexión y recargar'
          )}
        </button>
        
        {/* Información adicional */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Si el problema persiste:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Verifica tu conexión a internet</li>
            <li>Asegúrate de que el servidor esté funcionando</li>
            <li>Intenta recargar la página manualmente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
