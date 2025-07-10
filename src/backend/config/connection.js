const mongoose = require('mongoose');
const { Pool } = require('pg');
const { InfluxDB } = require('@influxdata/influxdb-client');
const mqtt = require('mqtt');
require('dotenv').config();
const User = require('../models/User');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');

// MongoDB
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

// PostgreSQL
const connectPostgreSQL = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB
});

// InfluxDB
const connectInfluxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN
});

// MQTT
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