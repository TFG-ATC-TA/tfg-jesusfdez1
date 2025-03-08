var express = require('express');
var router = express.Router();
const { InfluxDB } = require('@influxdata/influxdb-client');
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');

/* GET home page. */
router.use(cors());
  
// Function to construct the InfluxDB query string
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

router.get('/data', verifyToken, async function(req, res, next) {
    try {
    const query = constructQuery(req); // Call the function to get the query string
    const client = new InfluxDB({ url: process.env.INFLUXDB_URL, token: process.env.INFLUXDB_TOKEN });
    const result = await client.getQueryApi(process.env.INFLUXDB_ORG).collectRows(query);
    res.send(JSON.stringify(result));
    } catch (error) {
        console.error('Error constructing query:', error);
        res.send(JSON.stringify([])); // Send empty JSON array in case of error
    }
});

module.exports = router;

    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:51:19.47Z&stop=2024-10-07T13:51:19.47Z&_measurement=board_status&fields=fields_battery_voltage,another_field&tags_board_id=01&every=1m0s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:51:19.47Z&stop=2024-10-07T13:51:19.47Z&_measurement=board_temperature&fields=fields_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-07T07:57:28.93Z&stop=2024-10-07T13:51:19.47Z&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-09-07T09:18:37.345Z&stop=2024-10-07T15:18:37.346Z&_measurement=board_status&fields=fields_battery_voltage&tags_board_id=01&every=1m0s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-09T20:48:13.353Z&stop=2024-10-09T23:48:13.353Z&_measurement=6_dof_imu&fields=fields_gyro_x&tags_board_id=01&every=15s&fn=last&createEmpty=false&yieldName=last
    // http://localhost:5001/history/data?bucket=farm-01&start=2024-10-09T20:48:13.353Z&stop=2024-10-09T23:48:13.353Z&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&tags_board_id=01&every=1s&fn=last&createEmpty=false&yieldName=last
