/**
 * Wrapper principal para funcionalidades de Progressive Web App (PWA)
 * Coordina todos los componentes relacionados con PWA
 */

'use client';

import { useEffect, useState } from 'react';
import PWAInstallPrompt from './install-prompt';
import OfflineHandler from './offline-handler';
import UpdatePrompt from './update-prompt';
import ServiceWorkerRegistration from './service-worker-registration';

/**
 * Componente wrapper que coordina todas las funcionalidades de PWA
 * Maneja la hidratación del cliente y renderiza los componentes PWA
 */
export default function PWAWrapper() {
  const [isClient, setIsClient] = useState(false);

  // Asegurar que el componente se ejecute solo en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // No renderizar nada hasta que el componente esté hidratado
  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Registro del service worker para funcionalidad offline */}
      <ServiceWorkerRegistration />
      
      {/* Manejo de estado offline */}
      <OfflineHandler />
      
      {/* Prompt para instalar la aplicación */}
      <PWAInstallPrompt />
      
      {/* Prompt para actualizar la aplicación */}
      <UpdatePrompt />
    </>
  );
}
