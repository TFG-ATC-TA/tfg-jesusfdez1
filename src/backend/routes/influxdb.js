/**
 * Rutas para consulta de datos históricos en InfluxDB
 * Proporciona acceso a datos de sensores y métricas en tiempo real
 */

var express = require('express');
var router = express.Router();
const { connectInfluxDB } = require('../config/connection');
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const { 
  badRequest, 
  internalError 
} = require('../utils/responseHandler');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');

/* GET home page. */
router.use(cors());
router.use(express.json());
  
/**
 * Construye la consulta de InfluxDB basada en los parámetros de la petición
 * @param {object} req - Objeto request con parámetros de consulta
 * @returns {string} - Consulta de InfluxDB formateada
 */
function constructQuery(req) {
    const {
        bucket,
        start,
        stop,
        fields,
        every,
        fn,
        createEmpty,
        yieldName,
        ...filters // Capture all remaining query parameters as filters
    } = req.query;

    // Start with the mandatory part of the query
    let query = `from(bucket: "${bucket}")`;

    // Add optional parts based on query parameters
    if (start) {
        if (stop) {
        query += `\n    |> range(start: ${start}, stop: ${stop})`;
        } else {
            query += `\n    |> range(start: ${start})`;
        }
    }

    // Handle field filters
    if (fields) {
        //If fields is a comma-separated string, split it into an array
        const fieldsArray = fields.split(',');
        if (Array.isArray(fieldsArray) && fieldsArray.length > 0) {
            const fieldFilters = fieldsArray.map(field => `r["_field"] == "${field}"`).join(' or ');
            query += `\n    |> filter(fn: (r) => ${fieldFilters})`;
        }
    }
    
    if (filters) {
        Object.keys(filters).forEach(param => {
            const values = Array.isArray(filters[param]) ? filters[param] : [filters[param]];
            values.forEach(value => {
                query += `\n    |> filter(fn: (r) => r["${param}"] == "${value}")`;
            });
        });
    }

    // Handle aggregation and yield
    if (every && fn && createEmpty) {
        query += `\n    |> aggregateWindow(every: ${every}, fn: ${fn}, createEmpty: ${createEmpty})`;
    }

    if (yieldName) {
        query += `\n    |> yield(name: "${yieldName}")`;
    }
    return query;
}

/**
 * GET /history/data - Obtener datos históricos de InfluxDB
 * Construye consultas dinámicas basadas en parámetros de la petición
 * Incluye filtros por bucket, rango de tiempo, campos y tags
 */
router.get('/data', verifyToken, async function(req, res, next) {
    try {
    const query = constructQuery(req); // Call the function to get the query string
    const result = await connectInfluxDB.getQueryApi(process.env.INFLUXDB_ORG).collectRows(query);
    res.send(JSON.stringify(result));
    } catch (error) {
        devConsole.error('Error constructing query:', error);
        res.send(JSON.stringify([])); // Send empty JSON array in case of error
    }
});

/**
 * POST /history/historicalData - Obtener datos históricos de InfluxDB
 * Filtra por granja, fecha, boardIds y tanque
 * Adaptado del proyecto tfg-DaniLopez23
 */
router.post('/historicalData', verifyToken, async (req, res) => {
  const { farm, date, boardIds, tank } = req.body;
  devConsole.log("Received filters:", { farm, date, boardIds, tank });

  try {
    if (!date) {
      return badRequest(res, 'No date selected.');
    }

    if (!Array.isArray(boardIds) || boardIds.length === 0) {
      return badRequest(res, 'Must provide a valid array of board IDs.');
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const stopDate = new Date(date);
    stopDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(stopDate.getTime())) {
      return badRequest(res, 'Fechas inválidas');
    }

    const start = startDate.toISOString();
    const stop = stopDate.toISOString();

    const validBoardIds = boardIds.filter(
      (id) => typeof id === "string" && id.trim() !== ""
    );

    if (validBoardIds.length === 0) {
      return badRequest(res, 'All provided board IDs are invalid.');
    }

    const fluxQuery = `
      from(bucket: "${farm}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r["_measurement"] == "6_dof_imu" or r["_measurement"] == "air_quality" or r["_measurement"] == "encoder" or r["_measurement"] == "magnetic_switch" or r["_measurement"] == "tank_distance" or r["_measurement"] == "weight" or r["_measurement"] == "temperature_probe")
        |> filter(fn: (r) => ${validBoardIds
          .map((id) => `r["tags_board_id"] == "${id}"`)
          .join(" or ")})
        |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    devConsole.log("Executing query:", fluxQuery);

    const result = await connectInfluxDB.getQueryApi(process.env.INFLUXDB_ORG).collectRows(fluxQuery);

    if (!result || result.length === 0) {
      devConsole.log("No historical data found for the given filters.");
      return res.status(200).json({
        message: "No historical data found for the selected filters.",
        data: null,
      });
    }
    
    const formattedResult = {};

    result.forEach((row) => {
      const time = new Date(row._time).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      });

      const {
        _measurement: measurement,
        _field: rawField,
        _value: rawValue,
        tags_board_id: boardId,
        tags_sensor_id: sensorId,
        ...tags
      } = row;

      // Debug: Log each row being processed
      devConsole.log(`Processing row - Measurement: ${measurement}, Field: ${rawField}, Value: ${rawValue}, BoardId: ${boardId}`);

      // Redondear el valor a 2 decimales
      const value = parseFloat(rawValue.toFixed(2));

      // Limpiar el nombre del campo eliminando el prefijo "fields_"
      const field = rawField.startsWith("fields_")
        ? rawField.replace("fields_", "")
        : rawField;

      // Determine the key for the formatted result based on the measurement
      const measurementMap = {
        "6_dof_imu": "gyroscopeData",
        air_quality: "airQualityData",
        encoder: "encoderData",
        magnetic_switch: "switchStatus",
        tank_distance: "milkQuantityData",
        weight: "weightData",
        temperature_probe: "tankTemperaturesData",
      };

      const key = measurementMap[measurement] || measurement;

      if (!formattedResult[time]) {
        formattedResult[time] = {};
      }

      if (!formattedResult[time][key]) {
        formattedResult[time][key] = {
          measurement,
          tags: {
            board_id: boardId,
            sensor_id: sensorId,
            ...tags,
          },
          readableDate: new Date(row._time).toLocaleString("en-US", {
            timeZone: "UTC",
          }),
          value: {}, // Initialize as an object to handle multiple fields
        };
      }

      // Handle specific cases for weight and encoder
      if (measurement === "weight" || measurement === "encoder") {
        if (typeof formattedResult[time][key].value !== "object") {
          formattedResult[time][key].value = {};
        }
        formattedResult[time][key].value[sensorId] = value;
        
        // Debug: Log weight processing
        if (measurement === "weight") {
          devConsole.log(`Weight processed - Time: ${time}, SensorId: ${sensorId}, Value: ${value}`);
          devConsole.log(`Current weightData value object:`, formattedResult[time][key].value);
        }
      } else if (measurement === "tank_distance") {
        // Only include the "range" field for milkQuantityData and apply the calculation
        if (field === "range" && tank?.height) {
          formattedResult[time][key].value = (value / tank.height) * 100;
        }
      } else {
        // For other measurements, store multiple fields in the value object
        formattedResult[time][key].value[field] = value;
      }

      // Debug: Log the processed data for air quality specifically
      if (measurement === "air_quality") {
        devConsole.log(`Air Quality processed - Time: ${time}, Key: ${key}, Field: ${field}, Value: ${value}`);
        devConsole.log(`Current airQualityData value object:`, formattedResult[time][key].value);
      }
    });

    // Post-process to handle cases where only one field exists
    Object.keys(formattedResult).forEach((time) => {
      Object.keys(formattedResult[time]).forEach((key) => {
        const valueObj = formattedResult[time][key].value;

        // If there's only one field, convert the value object to a single value
        const fields = Object.keys(valueObj);
        if (fields.length === 1) {
          formattedResult[time][key].value = valueObj[fields[0]];
        }
      });
    });

    // Debug: Log the final formatted result
    devConsole.log("Final formatted result keys:", Object.keys(formattedResult));
    if (Object.keys(formattedResult).length > 0) {
      const firstTime = Object.keys(formattedResult)[0];
      devConsole.log("Sample data for time", firstTime, ":", formattedResult[firstTime]);
    }

    return res.status(200).json(formattedResult);
  } catch (error) {
    devConsole.error("Error executing query:", error);
    return internalError(res, 'Error executing query', error);
  }
});

module.exports = router;

    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:51:19.47Z&stop=2024-10-07T13:51:19.47Z&_measurement=board_status&fields=fields_battery_voltage,another_field&tags_board_id=01&every=1m0s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:51:19.47Z&stop=2024-10-07T13:51:19.47Z&_measurement=board_temperature&fields=fields_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:57:28.93Z&stop=2024-10-07T13:51:19.47Z&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-09-07T09:18:37.345Z&stop=2024-10-07T15:18:37.346Z&_measurement=board_status&fields=fields_battery_voltage&tags_board_id=01&every=1m0s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-09T20:48:13.353Z&stop=2024-10-09T23:48:13.353Z&_measurement=6_dof_imu&fields=fields_gyro_x&tags_board_id=01&every=15s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-09T20:48:13.353Z&stop=2024-10-09T23:48:13.353Z&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
