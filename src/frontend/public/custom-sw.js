const CACHE_NAME = 'lactokeeper-offline-v1';
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
  console.log('SW: Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching critical resources');
        return cache.addAll(CRITICAL_CACHE_URLS);
      })
      .then(() => {
        console.log('SW: Skip waiting...');
        return self.skipWaiting();
      })
  );
});

// Activar el service worker y limpiar cachés antiguos
self.addEventListener('activate', event => {
  console.log('SW: Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Interceptar las peticiones
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar peticiones HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estrategia: Network First, fallback a offline.html para navegación
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si la respuesta es exitosa, devolverla
          if (response.status === 200) {
            return response;
          }
          // Si hay error del servidor, ir a offline
          throw new Error('Server error');
        })
        .catch(() => {
          // Si no hay conexión o error del servidor, servir página offline
          console.log('SW: Network failed, serving offline page');
          return caches.match(OFFLINE_URL)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Si no hay caché, crear una respuesta básica
              return new Response(
                createOfflineHTML(),
                {
                  headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache'
                  }
                }
              );
            });
        })
    );
    return;
  }
  
  // Para otros recursos, intentar red primero, luego caché
  event.respondWith(
    fetch(request)
      .then(response => {
        // Si es una respuesta exitosa, guardar en caché si es apropiado
        if (response.status === 200 && 
            (request.destination === 'image' || 
             request.destination === 'script' || 
             request.destination === 'style' ||
             request.url.includes('/icon-') ||
             request.url.includes('/favicon'))) {
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseToCache))
            .catch(err => console.log('SW: Cache put failed:', err));
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde caché
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('SW: Serving from cache:', request.url);
              return cachedResponse;
            }
            
            // Si no hay caché y es una petición de imagen, devolver placeholder
            if (request.destination === 'image') {
              return new Response(
                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Sin imagen</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            // Para otras peticiones, rechazar
            throw new Error('No cache available');
          });
      })
  );
});

// Crear HTML básico para offline si no hay caché
function createOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sin conexión - Lactokeeper</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .container { max-width: 28rem; width: 100%; text-align: center; }
        .icon-container { margin-bottom: 2rem; }
        .icon {
            width: 6rem; height: 6rem;
            background-color: #d1d5db;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        .description { color: #6b7280; margin-bottom: 1rem; }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        .warning p { font-size: 0.875rem; color: #92400e; }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #1f2937;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            border: none;
            cursor: pointer;
            font-weight: 500;
            width: 100%;
        }
        .btn:hover { background-color: #374151; }
        @media (prefers-color-scheme: dark) {
            body { background-color: #111827; color: white; }
            .icon { background-color: #374151; }
            h1 { color: white; }
            .warning { background-color: rgba(217, 119, 6, 0.3); border-color: #d97706; }
            .warning p { color: #fbbf24; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon-container">
            <div class="icon">⚠️</div>
        </div>
        <h1>Aplicación no disponible</h1>
        <p class="description">
            Lactokeeper requiere conexión a internet para funcionar correctamente. 
            Por favor, verifica tu conexión y vuelve a intentarlo.
        </p>
        <div class="warning">
            <p>
                <strong>Nota:</strong> Esta aplicación gestiona datos en tiempo real del sector lácteo 
                y requiere una conexión estable a internet para mostrar información actualizada.
            </p>
        </div>
        <button onclick="window.location.reload()" class="btn">
            Verificar conexión y recargar
        </button>
    </div>
</body>
</html>`;
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

console.log('SW: Service Worker loaded');