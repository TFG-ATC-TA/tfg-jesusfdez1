'use client';

import { useEffect, useState } from 'react';
import PWAInstallPrompt from './install-prompt';
import OfflineIndicator from './offline-indicator';
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
      <OfflineIndicator />
      <OfflineHandler />
      <PWAInstallPrompt />
      <UpdatePrompt />
    </>
  );
}
