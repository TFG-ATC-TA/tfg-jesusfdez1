const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Cargar variables de entorno para test
require('dotenv').config();

// Suprimir warnings de deprecación específicos en tests
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Suprimir warning específico de punycode
  if (warning.message && warning.message.includes('punycode')) {
    return;
  }
  // Si es otro warning, mostrarlo
  console.warn(warning.message);
});

let mongod;

// Setup de la base de datos en memoria para testing
beforeAll(async () => {
  // Solo conectar si no existe una conexión activa
  if (mongoose.connection.readyState === 0) {
    try {
      // Intentar crear MongoDB Memory Server con configuración más robusta
      mongod = await MongoMemoryServer.create({
        instance: {
          port: undefined, // Usar puerto aleatorio
          ip: '127.0.0.1', // Usar localhost específicamente
        },
        binary: {
          version: '5.0.21', // Versión más ligera y estable
        }
      });
      const uri = mongod.getUri();
      
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
    } catch (error) {
      // Silenciar warnings de MD5 y reintentar con configuración alternativa
      if (error.message.includes('MD5 check failed')) {
        console.warn('MD5 validation issue, retrying with alternative configuration...');
      } else {
        console.warn('Error creating MongoDB Memory Server, retrying...', error.message);
      }
      
      // Reintentar con configuración alternativa
      try {
        mongod = await MongoMemoryServer.create({
          instance: {
            port: Math.floor(Math.random() * 10000) + 20000, // Puerto aleatorio entre 20000-30000
            ip: '127.0.0.1',
          },
          binary: {
            skipMD5: true, // Omitir verificación MD5 en caso de problemas
          }
        });
        const uri = mongod.getUri();
        await mongoose.connect(uri, {
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
        });
      } catch (retryError) {
        console.error('Failed to create MongoDB Memory Server after retry:', retryError.message);
        throw retryError;
      }
    }
  }
}, 30000); // Aumentar timeout a 30 segundos

// Limpiar la base de datos después de cada test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const collections = mongoose.connection.collections;
      const deletePromises = Object.values(collections).map(collection => 
        collection.deleteMany({}).catch(err => {
          console.warn(`Error clearing collection ${collection.name}:`, err.message);
        })
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Error during afterEach cleanup:', error.message);
    }
  }
});

// Cerrar la conexión después de todos los tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.warn('Error closing mongoose connection:', error.message);
  }
  
  try {
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.warn('Error stopping MongoDB Memory Server:', error.message);
  }
}, 15000); // Timeout de 15 segundos

// Mock de variables de entorno para testing (solo las necesarias para MongoDB)
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Suprimir warnings de mongoose
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = 'true';
