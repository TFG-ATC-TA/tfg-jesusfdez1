// Service Worker personalizado para manejar navegaciones offline
const CACHE_NAME = 'lactokeeper-offline-v1';
const OFFLINE_URL = '/offline.html';

// Instalar el service worker y precachear recursos críticos
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching offline page');
        return cache.addAll([
          OFFLINE_URL,
          '/favicon.ico',
          '/logo.svg',
          '/manifest.json'
        ]);
      })
      .then(() => {
        console.log('SW: Install complete');
        return self.skipWaiting();
      })
  );
});

// Activar el service worker
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    self.clients.claim()
      .then(() => {
        console.log('SW: Activation complete');
      })
  );
});

// Interceptar solo peticiones específicas para minimizar interferencia
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  // Solo manejar peticiones del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Excluir completamente APIs, recursos Next.js, auth, y archivos estáticos
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // Lista de rutas que NUNCA debe interceptar el SW
  const excludedPaths = [
    '/api/',
    '/_next/',
    '/sw.js',
    '/custom-sw.js',
    '/favicon.ico',
    '/manifest.json',
    '/offline.html',
    '/login',
    '/auth/',
    '/img/',
    '/fonts/',
    '/vid/'
  ];
  
  // Si la ruta está excluida, no interceptar
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return;
  }

  // Solo interceptar navegaciones HTML cuando realmente NO HAY CONEXIÓN
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept') && 
       event.request.headers.get('accept').includes('text/html'))) {
    
    console.log('SW: Checking network for navigation:', pathname);
    
    event.respondWith(
      fetch(event.request, { 
        cache: 'no-cache',
        // Timeout más corto para detectar problemas de red rápidamente
        signal: AbortSignal.timeout(5000)
      })
        .then(response => {
          console.log('SW: Network response status:', response.status);
          
          // Cualquier respuesta válida (incluso errores HTTP) indica conectividad
          // Solo cachear respuestas exitosas
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          
          return response;
        })
        .catch(error => {
          console.log('SW: Network completely failed:', error.name, error.message);
          
          // Solo mostrar offline si es un error de red real (no timeout HTTP)
          if (error.name === 'TypeError' || error.name === 'TimeoutError') {
            console.log('SW: Serving offline page due to network failure');
            return caches.match(OFFLINE_URL)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Respuesta offline básica de emergencia
                return new Response(`
                  <!DOCTYPE html>
                  <html lang="es">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sin conexión - Lactokeeper</title>
                    <link rel="icon" href="/favicon.ico">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                            background-color: #f9fafb;
                            color: #111827;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 1rem;
                        }
                        
                        .container {
                            max-width: 28rem;
                            width: 100%;
                            text-align: center;
                            margin: 0 1rem;
                        }
                        
                        .icon-container {
                            margin-bottom: 2rem;
                        }
                        
                        .icon {
                            width: 6rem;
                            height: 6rem;
                            background-color: #d1d5db;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto;
                        }
                        
                        .icon svg {
                            width: 3rem;
                            height: 3rem;
                            color: #6b7280;
                        }
                        
                        h1 {
                            font-size: 1.5rem;
                            font-weight: bold;
                            color: #111827;
                            margin-bottom: 1rem;
                        }
                        
                        .description {
                            color: #6b7280;
                            margin-bottom: 1rem;
                        }
                        
                        .warning {
                            background-color: #fef3c7;
                            border: 1px solid #fcd34d;
                            border-radius: 0.5rem;
                            padding: 1rem;
                            margin-bottom: 1.5rem;
                        }
                        
                        .warning p {
                            font-size: 0.875rem;
                            color: #92400e;
                        }
                        
                        .actions {
                            display: flex;
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .btn {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            white-space: nowrap;
                            border-radius: 0.375rem;
                            text-decoration: none;
                            font-weight: 500;
                            font-size: 0.875rem;
                            border: none;
                            cursor: pointer;
                            transition: all 0.2s ease-in-out;
                            height: 2.5rem;
                            padding: 0.5rem 1rem;
                            width: 100%;
                            background-color: hsl(222.2 84% 4.9%);
                            color: hsl(210 40% 98%);
                        }
                        
                        .btn:hover:not(:disabled) {
                            background-color: hsl(222.2 84% 4.9% / 0.9);
                        }

                        .btn:disabled {
                            pointer-events: none;
                            opacity: 0.5;
                        }
                        
                        .btn-secondary {
                            background-color: #e5e7eb;
                            color: #374151;
                        }
                        
                        .btn-secondary:hover {
                            background-color: #d1d5db;
                        }
                        
                        @media (max-width: 640px) {
                            body {
                                padding: 1rem 0.75rem;
                            }
                            
                            .container {
                                margin: 0 0.5rem;
                                max-width: 100%;
                            }
                            
                            .btn {
                                height: 2.75rem;
                                font-size: 1rem;
                            }
                        }

                        @media (prefers-color-scheme: dark) {
                            body {
                                background-color: #111827;
                                color: white;
                            }
                            
                            .icon {
                                background-color: #374151;
                            }
                            
                            .icon svg {
                                color: #9ca3af;
                            }
                            
                            h1 {
                                color: white;
                            }
                            
                            .description {
                                color: #9ca3af;
                            }
                            
                            .warning {
                                background-color: rgba(217, 119, 6, 0.3);
                                border-color: #d97706;
                            }
                            
                            .warning p {
                                color: #fbbf24;
                            }
                            
                            .btn {
                                background-color: hsl(210 40% 98%);
                                color: hsl(222.2 84% 4.9%);
                            }
                            
                            .btn:hover:not(:disabled) {
                                background-color: hsl(210 40% 98% / 0.9);
                            }
                            
                            .btn-secondary {
                                background-color: #374151;
                                color: #e5e7eb;
                            }
                            
                            .btn-secondary:hover {
                                background-color: #4b5563;
                            }
                        }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                        <div class="icon-container">
                            <div class="icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM8.25 8.25h7.5v7.5h-7.5v-7.5z"/>
                                </svg>
                            </div>
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
                        
                        <div class="actions">
                            <button onclick="checkConnection()" class="btn" id="checkBtn">
                                Verificar conexión y recargar
                            </button>
                        </div>
                    </div>

                    <script>
                        async function checkConnection() {
                            const button = document.getElementById('checkBtn');
                            
                            button.disabled = true;
                            button.textContent = 'Verificando conexión...';
                            
                            try {
                                // Intentar hacer una petición simple para verificar conectividad
                                const response = await fetch('/', { 
                                    method: 'HEAD',
                                    cache: 'no-cache'
                                });
                                
                                if (response.ok || response.status === 401 || response.status === 403) {
                                    // Si hay respuesta (incluso error de autenticación), hay conectividad
                                    window.location.reload();
                                } else {
                                    throw new Error('No hay conexión');
                                }
                            } catch (error) {
                                // Si falla la petición, aún no hay conexión
                                button.disabled = false;
                                button.textContent = 'Verificar conexión y recargar';
                            }
                        }
                    </script>
                  </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
          } else {
            // Para cualquier otro tipo de error, no interceptar
            throw error;
          }
        })
    );
  }
});
