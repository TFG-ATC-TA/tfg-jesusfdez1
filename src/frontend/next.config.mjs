/**
 * Configuración de Next.js para la aplicación frontend
 * Incluye configuraciones de desarrollo, variables de entorno y optimizaciones
 * Define el comportamiento de la aplicación en desarrollo y producción
 */

/** @type {import('next').NextConfig} */
const nextConfig = {   
    // Habilita el modo estricto de React para detectar problemas
    // Ayuda a identificar efectos secundarios y problemas de renderizado
    reactStrictMode: true,
    
    // Configuración para variables de entorno
    // Hace disponibles las variables de entorno en el cliente
    // Permite acceso seguro a configuraciones desde el navegador
    env: {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    }
    
    // Configuración para desarrollo y producción
    // Opciones comentadas para uso futuro
    
    // Configuración de ESLint (comentada para desarrollo)
    // Permite ignorar errores de linting durante builds
//    eslint: {
//        ignoreDuringBuilds: true,
//    },
    
    // Configuración de TypeScript (comentada para desarrollo)
    // Permite ignorar errores de tipos durante builds
    // typescript: {
    //     ignoreBuildErrors: true,
    // },
};

export default nextConfig;
