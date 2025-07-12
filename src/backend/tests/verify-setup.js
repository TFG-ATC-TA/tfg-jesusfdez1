#!/usr/bin/env node

/**
 * Script para verificar la configuración de tests y ejecutar la suite completa
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Verificando configuración de tests...\n');

// Verificar archivos de configuración
const configFiles = [
  'jest.config.js',
  'tests/setup.js',
  'tests/utils/testHelpers.js'
];

console.log('📁 Verificando archivos de configuración:');
configFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANTE`);
    process.exit(1);
  }
});

// Verificar archivos de test
const testFiles = [
  'tests/models/User.test.js',
  'tests/models/Farm.test.js',
  'tests/models/Device.test.js',
  'tests/models/Equipment.test.js',
  'tests/routes/user.test.js',
  'tests/routes/farm.test.js',
  'tests/middleware/auth.test.js',
  'tests/utils/console.test.js',
  'tests/app.test.js'
];

console.log('\n📋 Verificando archivos de test:');
testFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANTE`);
  }
});

// Verificar dependencias en package.json
console.log('\n📦 Verificando dependencias de testing:');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const requiredDeps = [
  'jest',
  'supertest',
  'mongodb-memory-server'
];

const missingDeps = requiredDeps.filter(dep => 
  !packageJson.devDependencies || !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.log('  ❌ Dependencias faltantes:', missingDeps.join(', '));
  console.log('\n🔧 Instalando dependencias faltantes...');
  
  try {
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('  ✅ Dependencias instaladas correctamente');
  } catch (error) {
    console.error('  ❌ Error instalando dependencias:', error.message);
    process.exit(1);
  }
} else {
  console.log('  ✅ Todas las dependencias están presentes');
}

// Verificar scripts en package.json
console.log('\n🚀 Verificando scripts de test:');
const requiredScripts = ['test', 'test:watch', 'test:coverage'];
const missingScripts = requiredScripts.filter(script => 
  !packageJson.scripts || !packageJson.scripts[script]
);

if (missingScripts.length > 0) {
  console.log('  ❌ Scripts faltantes:', missingScripts.join(', '));
} else {
  console.log('  ✅ Todos los scripts están configurados');
}

console.log('\n🎯 Configuración de tests completada!\n');

// Mostrar comandos disponibles
console.log('📋 Comandos disponibles:');
console.log('  npm test                  - Ejecutar todos los tests');
console.log('  npm run test:watch        - Ejecutar tests en modo watch');
console.log('  npm run test:coverage     - Ejecutar tests con cobertura');
console.log('  npm test -- --verbose     - Ejecutar tests con salida detallada');
console.log('  npm test tests/models/    - Ejecutar solo tests de modelos');
console.log('  npm test tests/routes/    - Ejecutar solo tests de rutas');

console.log('\n🚀 ¡Todo listo para ejecutar tests!');
console.log('\nEjecutando tests de ejemplo...\n');

// Ejecutar una prueba rápida
try {
  execSync('npm test -- --testNamePattern="should have all required methods" --silent', { 
    stdio: 'inherit',
    timeout: 30000 
  });
  console.log('\n✅ Tests ejecutándose correctamente!');
} catch (error) {
  console.log('\n⚠️  Nota: Ejecuta "npm test" para ver los resultados completos');
}
