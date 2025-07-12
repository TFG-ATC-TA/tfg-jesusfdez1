/**
 * Archivo principal de la aplicación Express
 * Configura el servidor, middleware y rutas de la API
 */

var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Importación de todas las rutas de la API
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var farmRouter = require('./routes/farm'); 
var deviceRouter = require('./routes/device');
var equipmentRouter = require('./routes/equipment');
var influxdbRouter = require('./routes/influxdb');
var postgresRouter = require('./routes/postgresql');
var collectionRouter = require('./routes/collection');
var notificationRouter = require('./routes/notification');

// Importar el sistema de console personalizado para logging
const devConsole = require('./utils/console');

var app = express();
const connectDB = require('./config/connection'); // Ruta hacia el archivo de conexión de la base de datos

// Mostrar modo de ejecución al iniciar
const currentMode = process.env.NODE_ENV || 'production';
devConsole.log(`🚀 Servidor iniciando en modo: ${currentMode.toUpperCase()}`);
devConsole.log(`📝 Logs de consola: ${currentMode === 'development' || currentMode === 'dev' ? 'ACTIVADOS' : 'DESACTIVADOS'}`);
devConsole.log(`📋 Logs de Winston (inicio de sesión): SIEMPRE ACTIVOS`);

// Configuración de middleware básico
app.use(logger('dev')); // Middleware de logging para desarrollo
app.use(express.json()); // Parsear JSON en el body de las peticiones
app.use(express.urlencoded({ extended: false })); // Parsear datos de formularios
app.use(cookieParser()); // Parsear cookies

// Configuración de rutas de la API
app.use('/', indexRouter); // Ruta principal
app.use('/user', userRouter); // Gestión de usuarios
app.use('/farm', farmRouter); // Gestión de granjas
app.use('/device', deviceRouter); // Gestión de dispositivos
app.use('/equipment', equipmentRouter); // Gestión de equipamiento
app.use('/history', influxdbRouter); // Historial de datos (InfluxDB)
app.use('/postgres', postgresRouter); // Datos de PostgreSQL
app.use('/collection', collectionRouter); // Gestión de recolección de leche
app.use('/notification', notificationRouter); // Gestión de notificaciones

// Conectar a la base de datos MongoDB al iniciar la aplicación
connectDB.connectMongoDB();

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => next(createError(404)));

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  // Enviar respuesta JSON con detalles del error
  res.status(err.status || 500).json({
    error: err.message,
  });
});

module.exports = app;