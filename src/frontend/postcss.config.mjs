/**
 * Configuración de PostCSS para el proyecto frontend
 * Define los plugins de procesamiento de CSS
 * Optimiza y transforma los estilos CSS durante el build
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Plugin de Tailwind CSS para procesar clases utilitarias
    // Genera CSS optimizado basado en las clases utilizadas
    tailwindcss: {},
  },
};

export default config;
