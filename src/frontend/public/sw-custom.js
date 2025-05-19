// Custom Service Worker additions for better offline handling

// Función personalizada para manejar navigation requests offline
const handleNavigationRequest = async (event) => {
  try {
    // Intentar la red primero
    const response = await fetch(event.request);
    return response;
  } catch (error) {
    // Si falla la red, servir la página offline
    console.log('Network failed, serving offline page');
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline page not found', { status: 404 });
  }
};

// Mejorar el manejo de errores de red
self.addEventListener('fetch', (event) => {
  // Solo interceptar navigation requests (páginas HTML)
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    
    // Excluir API calls y recursos estáticos
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('/_next/') ||
        event.request.url.includes('.js') ||
        event.request.url.includes('.css') ||
        event.request.url.includes('.png') ||
        event.request.url.includes('.jpg') ||
        event.request.url.includes('.svg')) {
      return;
    }

    event.respondWith(handleNavigationRequest(event));
  }
});

// Manejar la activación del service worker
self.addEventListener('activate', (event) => {
  console.log('Custom SW: Service Worker activated');
  
  // Claim all clients immediately
  event.waitUntil(
    clients.claim().then(() => {
      console.log('Custom SW: All clients claimed');
    })
  );
});

// Mejorar el precaching de la página offline
self.addEventListener('install', (event) => {
  console.log('Custom SW: Service Worker installing');
  
  event.waitUntil(
    caches.open('offline-cache-v1').then((cache) => {
      console.log('Custom SW: Caching offline page');
      return cache.addAll([
        '/offline.html',
        '/favicon.ico',
        '/logo.svg',
        '/manifest.json'
      ]);
    })
  );
});

// Función de fallback mejorada
self.fallback = async (request) => {
  const destination = request.destination;
  const url = new URL(request.url);
  
  console.log('Custom SW: Fallback triggered for:', request.url, 'Destination:', destination);
  
  if (destination === 'document' || request.mode === 'navigate') {
    console.log('Custom SW: Serving offline page for navigation request');
    return caches.match('/offline.html', { ignoreSearch: true });
  }
  
  return new Response('Content not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
};
