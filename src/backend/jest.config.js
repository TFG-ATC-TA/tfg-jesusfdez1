module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!coverage/**',
    '!**/tests/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 45000, // Aumentado a 45 segundos
  forceExit: true,
  clearMocks: true,
  detectOpenHandles: false, // Evitar warnings de handles abiertos
  maxWorkers: 1, // Ejecutar tests serialmente para evitar conflictos de puerto
  workerIdleMemoryLimit: '512MB',
  // Configuración adicional para estabilidad
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
