/**
 * Rutas para predicción de estados del tanque
 * Adaptado del proyecto tfg-DaniLopez23
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { InfluxDB } = require("@influxdata/influxdb-client");
const axios = require("axios");
const { verifyToken } = require('../middleware/auth');
const { 
  badRequest, 
  internalError 
} = require('../utils/responseHandler');
const devConsole = require('../utils/console');

// Middleware
router.use(cors());
router.use(express.json());

// Configuración de InfluxDB
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG;
const url = process.env.INFLUXDB_URL;

devConsole.log("INFLUX CONFIGURATION:", { 
  token: token ? '***' : 'undefined', 
  org, 
  url 
});

// Verificar que las variables de entorno estén configuradas
if (!url || !token || !org) {
  devConsole.error('Error: Variables de entorno de InfluxDB no configuradas');
  devConsole.error('INFLUXDB_URL, INFLUXDB_TOKEN e INFLUXDB_ORG son requeridas');
  devConsole.error('Consulta el archivo env-template.txt para la configuración');
}

// Solo crear la instancia si las variables están configuradas
let client, queryApi;
if (url && token && org) {
  client = new InfluxDB({ url, token });
  queryApi = client.getQueryApi(org);
}

// Middleware de validación
const validateRequest = (req, res, next) => {
  const { farm, date, boardIds } = req.body;
  if (!farm) return badRequest(res, 'Farm ID inválido.');
  if (!date || isNaN(Date.parse(date)))
    return badRequest(res, 'Fecha no válida.');
  if (!Array.isArray(boardIds) || boardIds.length === 0)
    return badRequest(res, 'Array de board IDs no válido.');
  next();
};

function processData(rawData) {
  // Valor estándar inicial para las temperaturas
  let lastTemps = { surface: 4, overSurface: 6 };
  const processed = [];

  // Ordenar los datos por DateTime
  rawData.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

  rawData.forEach((row) => {
    const newRow = {
      DateTime: row.DateTime,
      AccelX: row.AccelX !== null ? row.AccelX : null,
      SurfaceTemperature:
        row["Surface temperature (ºC)"] !== null
          ? row["Surface temperature (ºC)"]
          : lastTemps.surface, // Usar el último valor conocido o el estándar
      OverSurfaceTemperature:
        row["Over surface temperature (ºC)"] !== null
          ? row["Over surface temperature (ºC)"]
          : lastTemps.overSurface, // Usar el último valor conocido o el estándar
    };

    // Actualizar últimos valores conocidos si hay datos de temperatura
    if (row["Surface temperature (ºC)"] !== null) {
      lastTemps.surface = row["Surface temperature (ºC)"];
    }
    if (row["Over surface temperature (ºC)"] !== null) {
      lastTemps.overSurface = row["Over surface temperature (ºC)"];
    }

    // Solo incluir filas con AccelX
    if (newRow.AccelX !== null) {
      processed.push(newRow);
    }
  });

  return processed;
}

/**
 * POST /predictTankState - Predicción de estados del tanque
 * Consulta datos históricos y envía a ML-API para predicción
 */
router.post('/', verifyToken, validateRequest, async (req, res) => {
  const { farm, tank, date, boardIds } = req.body;
  devConsole.log("Received filters:", { farm, tank, date, boardIds });

  try {
    // Verificar que InfluxDB esté configurado
    if (!queryApi) {
      return internalError(res, 'InfluxDB no está configurado. Verifica las variables de entorno.');
    }

    // Buscar en MongoDB (si existe el modelo TankState)
    // TODO: Implementar modelo TankState si es necesario
    // const existingData = await TankState.findOne({
    //   farmId: farm,
    //   tankId: tank,
    //   date: new Date(date),
    // });

    // if (existingData) {
    //   devConsole.log("Datos encontrados en MongoDB:", existingData);
    //   return res.status(200).json(existingData);
    // }

    devConsole.log("Datos no encontrados en MongoDB. Consultando InfluxDB...");

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const stopDate = new Date(date);
    stopDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(stopDate.getTime()))
      return badRequest(res, 'Fechas inválidas');

    const start = startDate.toISOString();
    const stop = stopDate.toISOString();

    // Consultar InfluxDB
    const fluxQuery = `
      from(bucket: "${farm}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r["_field"] == "fields_accel_x" 
            or r["_field"] == "fields_surface_temperature" 
            or r["_field"] == "fields_over_surface_temperature")
        |> filter(fn: (r) => ${boardIds
          .map((id) => `r["tags_board_id"] == "${id}"`)
          .join(" or ")})
          |> filter(fn: (r) => r["tags_board_id"] == "00" or r["tags_board_id"] == "01" or r["tags_board_id"] == "02")
        |> aggregateWindow(
            every: 5s,
            fn: mean,
            createEmpty: true
        )
        |> fill(usePrevious: true)
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> keep(columns: ["_time", "fields_accel_x", 
              "fields_surface_temperature", 
              "fields_over_surface_temperature"])
        |> rename(columns: {
            _time: "DateTime",
            fields_accel_x: "AccelX",
            fields_surface_temperature: "Surface temperature (ºC)",
            fields_over_surface_temperature: "Over surface temperature (ºC)"
        })
    `;

    devConsole.log("Executing query:", fluxQuery);

    const executeQuery = async (query) => {
      return new Promise((resolve, reject) => {
        const influxData = [];
        queryApi.queryRows(query, {
          next(row, tableMeta) {
            influxData.push(tableMeta.toObject(row));
          },
          error(error) {
            devConsole.error("Error en InfluxDB:", error.message);
            reject(new Error("Error en consulta a InfluxDB"));
          },
          complete() {
            devConsole.log("Consulta InfluxDB completada");
            resolve(influxData);
          },
        });
      });
    };

    const influxData = await executeQuery(fluxQuery);
    devConsole.log("Datos de InfluxDB:", influxData.slice(0, 5));

    if (influxData.length === 0) {
      devConsole.log(
        "No se encontraron datos en InfluxDB para la fecha y filtros dados."
      );
      return res.status(200).json(null);
    }

    const processedData = processData(influxData);
    devConsole.log("Datos procesados:", processedData.slice(0, 5));

    // Enviar a ML-API en el formato requerido
    const payload = {
      data: processedData.map((row) => ({
        DateTime: new Date(row.DateTime)
          .toISOString()
          .replace("T", " ") // Reemplazar 'T' por un espacio
          .replace(/\.\d{3}Z$/, "+00:00"), // Eliminar milisegundos y agregar '+00:00'
        AccelX: row.AccelX,
        OverSurfaceTemperature: row["OverSurfaceTemperature"],
        SurfaceTemperature: row["SurfaceTemperature"],
      })),
    };

    devConsole.log("Datos procesados para ML-API:", payload.data.slice(0, 5));

    // Enviar datos a la API de ML
    try {
      // Enviar a la API de ML
      const response = await axios.post("http://ml-api:8000/predict", payload);
      devConsole.log("Respuesta de ML-API:", response.data);

      // Transformar los intervalos para MongoDB
      const transformedStates = response.data.intervals.map((interval) => ({
        startTime: new Date(interval.inicio).toISOString().substring(11, 16), // Extraer HH:mm
        endTime: new Date(interval.fin).toISOString().substring(11, 16), // Extraer HH:mm
        state: interval.estado,
      }));

      // Guardar en MongoDB (si existe el modelo TankState)
      // TODO: Implementar modelo TankState si es necesario
      // const newTankState = await TankState.create({
      //   farmId: farm,
      //   tankId: tank,
      //   date: new Date(date),
      //   states: transformedStates,
      // });

      devConsole.log("Predicción procesada");
      return res.status(200).json({
        farmId: farm,
        tankId: tank,
        date: new Date(date),
        states: transformedStates,
      });
    } catch (error) {
      devConsole.error("Error en ML-API:", error.message);
      return internalError(res, 'Error en ML-API', error);
    }
  } catch (error) {
    devConsole.error("Error en PredictTankStatesRouter:", error.message);
    return internalError(res, 'Error interno del servidor', error);
  }
});

/**
 * POST /predictTankState/real-time - Predicción en tiempo real
 * Consulta datos de la última media hora para predicción inmediata
 */
router.post('/real-time', verifyToken, async (req, res) => {
  const { farm, tank, boardIds } = req.body;
  devConsole.log("Received filters for real-time:", { farm, tank, boardIds });

  try {
    // Calcular el rango de tiempo para la última media hora
    const stopDate = new Date(Date.now()); // Fecha actual
    const startDate = new Date(stopDate.getTime() - 30 * 60 * 1000); // Media hora antes

    if (isNaN(startDate.getTime()) || isNaN(stopDate.getTime()))
      return badRequest(res, 'Fechas inválidas');

    const start = startDate.toISOString();
    const stop = stopDate.toISOString();

    devConsole.log("Rango de tiempo para real-time:", { start, stop });

    // Consultar InfluxDB
    const fluxQuery = `
      from(bucket: "${farm}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r["_field"] == "fields_accel_x" 
            or r["_field"] == "fields_surface_temperature" 
            or r["_field"] == "fields_over_surface_temperature")
        |> filter(fn: (r) => ${boardIds
          .map((id) => `r["tags_board_id"] == "${id}"`)
          .join(" or ")})
        |> aggregateWindow(
            every: 5s,
            fn: mean,
            createEmpty: true
        )
        |> fill(usePrevious: true)
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> keep(columns: ["_time", "fields_accel_x", 
              "fields_surface_temperature", 
              "fields_over_surface_temperature"])
        |> rename(columns: {
            _time: "DateTime",
            fields_accel_x: "AccelX",
            fields_surface_temperature: "Surface temperature (ºC)",
            fields_over_surface_temperature: "Over surface temperature (ºC)"
        })
    `;

    devConsole.log("Executing real-time query:", fluxQuery);

    // Verificar que InfluxDB esté configurado
    if (!queryApi) {
      return internalError(res, 'InfluxDB no está configurado. Verifica las variables de entorno.');
    }

    const executeQuery = async (query) => {
      return new Promise((resolve, reject) => {
        const influxData = [];
        queryApi.queryRows(query, {
          next(row, tableMeta) {
            influxData.push(tableMeta.toObject(row));
          },
          error(error) {
            devConsole.error("Error en InfluxDB:", error.message, error.stack);
            // Si el error es por columna inexistente o datos insuficientes
            if (
              error.message &&
              (error.message.includes("rename error: column") ||
                error.message.includes("invalid time value"))
            ) {
              return reject(new Error("NO_DATA"));
            }
            reject(new Error("Error en consulta a InfluxDB"));
          },
          complete() {
            devConsole.log("Consulta InfluxDB completada");
            resolve(influxData);
          },
        });
      });
    };

    let influxData;
    try {
      influxData = await executeQuery(fluxQuery);
      devConsole.log("Datos de InfluxDB (real-time):", influxData.slice(0, 5));
    } catch (err) {
      if (err.message === "NO_DATA") {
        devConsole.log(
          "No hay datos suficientes en InfluxDB para los campos requeridos (real-time)."
        );
        return res.status(200).json({
          message:
            "No hay datos suficientes para realizar la predicción en tiempo real.",
          data: null,
        });
      }
      devConsole.error("Error en InfluxDB (real-time):", err.message);
      return internalError(res, 'Error en consulta a InfluxDB', err);
    }

    if (!influxData || influxData.length === 0) {
      devConsole.log(
        "No se encontraron datos en InfluxDB para la fecha y filtros dados (real-time)."
      );
      return res.status(200).json({
        message:
          "No se encontraron datos históricos para los filtros seleccionados.",
        data: null,
      });
    }

    const processedData = processData(influxData);
    devConsole.log("Datos procesados (real-time):", processedData.slice(0, 5));

    if (!processedData || processedData.length === 0) {
      devConsole.log("No hay datos válidos tras el procesado (real-time).");
      return res.status(200).json({
        message:
          "No se encontraron datos históricos válidos tras el procesado.",
        data: null,
      });
    }

    // Enviar a ML-API en el formato requerido
    const payload = {
      data: processedData.map((row) => ({
        DateTime: new Date(row.DateTime)
          .toISOString()
          .replace("T", " ") // Reemplazar 'T' por un espacio
          .replace(/\.\d{3}Z$/, "+00:00"), // Eliminar milisegundos y agregar '+00:00'
        AccelX: row.AccelX,
        OverSurfaceTemperature: row["OverSurfaceTemperature"],
        SurfaceTemperature: row["SurfaceTemperature"],
      })),
    };
    devConsole.log(
      `Cantidad de datos enviados a ML-API (real-time): ${payload.data.length}`
    );
    devConsole.log(
      "Datos procesados para ML-API (real-time):",
      payload.data.slice(0, 5)
    );

    // Enviar datos a la API de ML
    try {
      const response = await axios.post("http://ml-api:8000/predict", payload);
      devConsole.log("Respuesta de ML-API (real-time):", response.data);

      if (
        !response.data ||
        !Array.isArray(response.data.intervals) ||
        response.data.intervals.length === 0
      ) {
        devConsole.log("ML-API no devolvió intervalos válidos (real-time).");
        return res.status(200).json({
          message: "La ML-API no devolvió intervalos de predicción.",
          data: null,
        });
      }

      // Transformar los intervalos para la respuesta
      const transformedStates = response.data.intervals.map((interval) => ({
        startTime: new Date(interval.inicio).toISOString().substring(11, 16), // Extraer HH:mm
        endTime: new Date(interval.fin).toISOString().substring(11, 16), // Extraer HH:mm
        state: interval.estado,
      }));
      devConsole.log("Estados transformados (real-time):", transformedStates.slice(0, 5));
      return res.status(200).json({
        tankId: tank,
        farmId: farm,
        date: new Date(stopDate),
        states: transformedStates,
      });
    } catch (error) {
      devConsole.error("Error en ML-API (real-time):", error.message);
      return internalError(res, 'Error en ML-API', error);
    }
  } catch (error) {
    devConsole.error("Error en PredictTankStatesRouter (real-time):", error.message);
    return internalError(res, 'Error interno del servidor', error);
  }
});

module.exports = router; 