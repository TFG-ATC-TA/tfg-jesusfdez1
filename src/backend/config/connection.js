const mongoose = require('mongoose');
const { Pool } = require('pg');
const { InfluxDB } = require('@influxdata/influxdb-client');
const mqtt = require('mqtt');
require('dotenv').config();

// MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
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