/**
 * Configuración de conexiones a bases de datos y servicios
 * Incluye MongoDB, PostgreSQL, InfluxDB y MQTT
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');
const { InfluxDB } = require('@influxdata/influxdb-client');
const mqtt = require('mqtt');
require('dotenv').config();
const User = require('../models/User');

// Importar el sistema de console personalizado para logging
const devConsole = require('../utils/console');

/**
 * Conexión a MongoDB - Base de datos principal
 * Maneja la creación automática del usuario administrador
 */
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    devConsole.log('MongoDB connected successfully');
    
    // Crear usuario administrador si es la primera vez que se accede a la base de datos
    const adminExists = await User.findOne({ role: 'Administrador' });
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Administrador',
        surname: 'Sistema',
        email: 'admin@admin.com',
        passwordHash: '1234567aA', // Se encriptará automáticamente por el pre-save hook
        role: 'Administrador',
        farms: [] // Los administradores no tienen granjas según la validación
      });
      
      await adminUser.save();
    }
  } catch (error) {
    devConsole.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Conexión a PostgreSQL - Base de datos relacional
 * Para almacenar datos estructurados y relaciones complejas
 */
const connectPostgreSQL = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB
});

/**
 * Conexión a InfluxDB - Base de datos de series temporales
 * Para almacenar datos de sensores y métricas en tiempo real
 */
const connectInfluxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN
});

/**
 * Conexión a MQTT - Protocolo de mensajería
 * Para comunicación en tiempo real con dispositivos IoT
 */
const connectMQTT = () => {
  return mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}`,
    {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    }
  );
};

module.exports = {
  connectMongoDB,
  connectPostgreSQL,
  connectInfluxDB,
  connectMQTT
};