const CACHE_NAME = 'lactokeeper-offline-v2';
const OFFLINE_URL = '/offline.html';

// Archivos críticos para cachear
const CRITICAL_CACHE_URLS = [
  OFFLINE_URL,
  '/favicon.ico',
  '/icon-192x192.png',
  '/manifest.json'
];

// Instalar el service worker y pre-cachear archivos críticos
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activar el service worker y limpiar cachés antiguos
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Interceptar las peticiones
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Solo manejar peticiones HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  // Para navegación: Network First, fallback a offline.html
  if (request.mode === 'navigate') {
    const url = new URL(request.url);
    
    // No interceptar rutas que requieren autenticación - dejar que Next.js middleware las maneje
    const authRequiredRoutes = ['/', '/farms', '/users', '/devices', '/notifications'];
    const isAuthRoute = authRequiredRoutes.some(route => 
      url.pathname === route || url.pathname.startsWith(route + '/')
    );
    
    // Si es una ruta que requiere autenticación, no interceptar - dejar que Next.js la maneje
    if (isAuthRoute) {
      return;
    }
    
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si es una respuesta exitosa, devolverla
          if (response.ok) {
            return response;
          }
          // Para errores 4xx y 5xx, permitir que Next.js los maneje
          // Solo usar offline para errores de red reales
          if (response.status >= 400) {
            return response;
          }
          return Promise.reject();
        })
        .catch(() => 
          caches.match(OFFLINE_URL)
            .then(cachedResponse => cachedResponse || createOfflineResponse())
        )
    );
    return;
  }
  
  // Para otros recursos: Network First, fallback a caché
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cachear recursos importantes si la respuesta es exitosa
        if (response.status === 200 && shouldCache(request)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => 
        caches.match(request)
          .then(cachedResponse => cachedResponse || handleFallback(request))
      )
  );
});

// Determinar si un recurso debe ser cacheado
function shouldCache(request) {
  return request.destination === 'image' || 
         request.destination === 'script' || 
         request.destination === 'style' ||
         request.url.includes('/icon-') ||
         request.url.includes('/favicon');
}

// Manejar fallbacks para diferentes tipos de recursos
function handleFallback(request) {
  if (request.destination === 'image') {
    return new Response(
      '<svg width="200" height="200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 3 18 18"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  return Response.error();
}

// Crear respuesta offline básica si no hay caché
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sin conexión - Lactokeeper</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb; color: #111827; min-height: 100vh;
            display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .container { max-width: 28rem; width: 100%; text-align: center; }
        .icon { width: 6rem; height: 6rem; background: #d1d5db; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; }
        h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        .description { color: #6b7280; margin-bottom: 1rem; }
        .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 0.5rem; 
                  padding: 1rem; margin-bottom: 1.5rem; }
        .warning p { font-size: 0.875rem; color: #92400e; }
        .btn { background: #1f2937; color: white; padding: 0.75rem 1.5rem; 
               border-radius: 0.375rem; border: none; cursor: pointer; font-weight: 500; width: 100%; }
        .btn:hover { background: #374151; }
        @media (prefers-color-scheme: dark) {
            body { background: #111827; color: white; }
            .icon { background: #374151; }
            h1 { color: white; }
            .warning { background: rgba(217, 119, 6, 0.3); border-color: #d97706; }
            .warning p { color: #fbbf24; }
        }
    </style>
</head>
<body>
    <div class="container">
    <div class="container">
        <div class="icon-container">
            <div class="icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="m3 3 18 18"/>
                </svg>
            </div>
        </div>        <h1>Aplicación no disponible</h1>
        <p class="description">
            Lactokeeper requiere conexión a internet para funcionar correctamente. 
            Por favor, verifica tu conexión y vuelve a intentarlo.
        </p>
        <div class="warning">
            <p><strong>Nota:</strong> Esta aplicación gestiona datos en tiempo real del sector lácteo 
               y requiere una conexión estable a internet para mostrar información actualizada.</p>
        </div>
        <button onclick="window.location.reload()" class="btn">
            Verificar conexión y recargar
        </button>
    </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('SW: Service Worker loaded');