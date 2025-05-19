import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {   
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    fallbacks: {
        document: '/offline.html'
    },
    // Configuración más específica para evitar interferencia con auth
    publicExcludes: ['!custom-sw.js'],
    runtimeCaching: [
        {
            // Solo cachear navegaciones a rutas específicas, no todas
            urlPattern: ({ request, url }) => {
                // Solo interceptar páginas específicas, excluir auth completamente
                return request.mode === 'navigate' && 
                       !url.pathname.startsWith('/api/') &&
                       !url.pathname.startsWith('/auth/') &&
                       !url.pathname.startsWith('/_next/') &&
                       !url.pathname.includes('/login') &&
                       url.pathname !== '/';  // Excluir la raíz para permitir redirección a login
            },
            handler: 'NetworkFirst',
            options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 5,
                plugins: [
                    {
                        handlerDidError: async () => {
                            return caches.match('/offline.html');
                        }
                    }
                ]
            }
        }
    ]
})(nextConfig);
