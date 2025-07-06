var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var farmRouter = require('./routes/farm'); 
var deviceRouter = require('./routes/device');
var equipmentRouter = require('./routes/equipment');
var influxdbRouter = require('./routes/influxdb');
var postgresRouter = require('./routes/postgresql');
var collectionRouter = require('./routes/collection');
var notificationRouter = require('./routes/notification');

// Importar el sistema de console personalizado
const devConsole = require('./utils/console');

var app = express();
const connectDB = require('./config/connection'); // Ruta hacia el archivo de conexión de la base de datos

// Mostrar modo de ejecución al iniciar
const currentMode = process.env.NODE_ENV || 'production';
devConsole.log(`🚀 Servidor iniciando en modo: ${currentMode.toUpperCase()}`);
devConsole.log(`📝 Logs de consola: ${currentMode === 'development' || currentMode === 'dev' ? 'ACTIVADOS' : 'DESACTIVADOS'}`);
devConsole.log(`📋 Logs de Winston (inicio de sesión): SIEMPRE ACTIVOS`);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/farm', farmRouter); 
app.use('/device', deviceRouter);
app.use('/equipment', equipmentRouter);
app.use('/history', influxdbRouter);
app.use('/postgres', postgresRouter);
app.use('/collection', collectionRouter);
app.use('/notification', notificationRouter);



// Conectar a la base de datos
connectDB.connectMongoDB();
// Catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// Error handler
app.use((err, req, res, next) => {

  // Send JSON response with error details
  res.status(err.status || 500).json({
    error: err.message,
  });
});


module.exports = app;