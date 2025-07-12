/**
 * Configuración de Jest para testing del proyecto frontend
 * Configura el entorno de testing para componentes React y Next.js
 * Incluye configuración de cobertura, transformaciones y alias de módulos
 */

const nextJest = require('next/jest')

/**
 * Crea la configuración base de Jest para Next.js
 * Carga automáticamente next.config.js y archivos .env
 * Proporciona configuración optimizada para el framework
 */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

/**
 * Configuración personalizada de Jest
 * Define el entorno de testing, patrones de archivos y cobertura
 * Optimiza el testing para componentes React y TypeScript
 */
const customJestConfig = {
  // Archivo de configuración que se ejecuta antes de cada test
  // Configura el entorno de testing y utilidades globales
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Entorno de testing que simula el DOM del navegador
  // Permite testing de componentes React que usan APIs del DOM
  testEnvironment: 'jsdom',
  
  // Patrones de archivos a ignorar durante el testing
  // Evita procesar archivos de build y dependencias
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  
  // Archivos incluidos en el reporte de cobertura de código
  // Incluye componentes, hooks, utilidades y páginas
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  
  // Mapeo de alias de módulos para importaciones
  // Permite usar @/ para importar desde la raíz del proyecto
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Patrones de archivos de test a ejecutar
  // Busca archivos .test en el directorio tests
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Transformaciones para archivos TypeScript y JSX
  // Utiliza babel-jest con presets de Next.js
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Extensiones de archivos que Jest puede procesar
  // Incluye TypeScript y JavaScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Directorio raíz para el testing
  // Define dónde Jest debe buscar archivos de test
  roots: ['<rootDir>'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
