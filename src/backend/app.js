var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');


var app = express();
const connectDB = require('./config/db'); // Ruta hacia el archivo de conexión de la base de datos


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/user', userRouter);


// Conectar a la base de datos
connectDB();
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