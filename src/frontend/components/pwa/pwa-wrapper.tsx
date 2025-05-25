'use client';

import { useEffect, useState } from 'react';
import PWAInstallPrompt from './install-prompt';
import OfflineHandler from './offline-handler';
import UpdatePrompt from './update-prompt';
import ServiceWorkerRegistration from './service-worker-registration';

export default function PWAWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineHandler />
      <PWAInstallPrompt />
      <UpdatePrompt />
    </>
  );
}
