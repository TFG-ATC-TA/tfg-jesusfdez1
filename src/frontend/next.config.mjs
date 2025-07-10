/** @type {import('next').NextConfig} */
const nextConfig = {   
    reactStrictMode: true,
    // Configuración para variables de entorno
    env: {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    }
    // Configuración para desarrollo y producción

//    eslint: {
//        ignoreDuringBuilds: true,
//    },
    // typescript: {
    //     ignoreBuildErrors: true,
    // },
};

export default nextConfig;
