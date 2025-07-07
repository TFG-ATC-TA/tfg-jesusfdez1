const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Cargar variables de entorno para test
require('dotenv').config();

let mongod;

// Setup de la base de datos en memoria para testing
beforeAll(async () => {
  // Solo conectar si no existe una conexión activa
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri);
  }
});

// Limpiar la base de datos después de cada test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Cerrar la conexión después de todos los tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
});

// Mock de variables de entorno para testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.POSTGRES_USER = 'test-user';
process.env.POSTGRES_PASSWORD = 'test-password';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'test-db';
process.env.INFLUXDB_URL = 'http://localhost:8086';
process.env.INFLUXDB_TOKEN = 'test-token';
process.env.MQTT_PROTOCOL = 'mqtt';
process.env.MQTT_HOST = 'localhost:1883';
process.env.MQTT_USERNAME = 'test-user';
process.env.MQTT_PASSWORD = 'test-password';

// Suprimir warnings de mongoose
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = 'true';
