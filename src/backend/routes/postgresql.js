/**
 * Rutas para consulta de datos estructurados en PostgreSQL
 * Proporciona acceso a estadísticas y actividades de las granjas
 */

var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const { connectPostgreSQL } = require('../config/connection');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');

require('dotenv').config();

/* Setup CORS */
router.use(cors());

/**
 * Función determinista para calcular cooling rate según fecha
 * Genera un valor consistente entre 12°C/h y 18°C/h basado en la fecha
 * @param {string} dateStr - Fecha en formato string
 * @returns {string} - Cooling rate en formato "X°C/h"
 */
function getCoolingRateByDate(dateStr) {
    // Convierte la fecha a un número simple y genera un valor entre 12 y 18
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rate = 12 + (Math.abs(hash) % 7); // 12°C/h a 18°C/h
    return `${rate}°C/h`;
}

/**
 * GET /postgres/farm-activities - Obtener estadísticas de actividades de la granja
 * Consulta datos de estados de tanques y genera estadísticas detalladas
 * Incluye paginación por días y cálculos de ciclos de ordeño
 */
router.get('/farm-activities', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const daysPerPage = parseInt(req.query.daysPerPage) || 4;
        const startTime = req.query.startDate ? new Date(req.query.startDate) : null;
        const endTime = req.query.endDate ? new Date(req.query.endDate) : null;

        let query = 'SELECT * FROM tank_state_intervals';
        const queryParams = [];
        if (startTime && endTime) {
            query += ' WHERE start_time >= $1 AND end_time <= $2';
            queryParams.push(startTime.toISOString(), endTime.toISOString());
        } else if (startTime) {
            query += ' WHERE start_time >= $1';
            queryParams.push(startTime.toISOString());
        } else if (endTime) {
            query += ' WHERE end_time <= $1';
            queryParams.push(endTime.toISOString());
        }
        query += ' ORDER BY start_time';
        const result = await connectPostgreSQL.query(query, queryParams);
        const data = result.rows;

        // Utilidad para duración en minutos
        const getDurationMinutes = (start, end) => Math.round((new Date(end) - new Date(start)) / 60000);

        // Estadísticas y timeline
        const stats = {}, timelineData = {};
        data.forEach(interval => {
            const { state, start_time, end_time } = interval;
            const duration = getDurationMinutes(start_time, end_time);
            if (!stats[state]) stats[state] = { count: 0, totalDuration: 0, intervals: [] };
            stats[state].count++;
            stats[state].totalDuration += duration;
            stats[state].intervals.push({ start: start_time, end: end_time, duration });
            if (!timelineData[state]) timelineData[state] = [];
            const startDate = new Date(start_time);
            timelineData[state].push({
                start: startDate.toTimeString().slice(0, 5),
                end: new Date(end_time).toTimeString().slice(0, 5),
                day: Math.floor((startDate - new Date('2025-04-03')) / 86400000) + 1,
                date: startDate.toISOString().split('T')[0]
            });
        });

        // Estadísticas resumidas
        const milkingStats = stats['milking'] || { count: 0, totalDuration: 0 };
        const agitationStats = stats['maintenance'] || { count: 0, totalDuration: 0 };
        const emptyingStats = stats['emptying'] || { count: 0, totalDuration: 0 };
        const washingStats = stats['cleaning'] || { count: 0, totalDuration: 0 };
        const avgMilkingDuration = milkingStats.count ? Math.round(milkingStats.totalDuration / milkingStats.count) : 0;

        // Ciclos ordeño+enfriamiento
        let cycles = 0, totalCycleDuration = 0;
        const sortedIntervals = [...data].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        for (let i = 0; i < sortedIntervals.length - 1; i++) {
            if (sortedIntervals[i].state === 'milking' && sortedIntervals[i + 1].state === 'cooling') {
                cycles++;
                totalCycleDuration += getDurationMinutes(sortedIntervals[i].start_time, sortedIntervals[i + 1].end_time);
            }
        }
        const avgCycleDuration = cycles ? Math.round(totalCycleDuration / cycles) : 0;

        // Fechas únicas y paginación
        const relevantStates = ['milking', 'maintenance', 'emptying', 'cleaning'];
        const relevantTimelineData = relevantStates.reduce((acc, state) => {
            if (timelineData[state]) acc[state] = timelineData[state];
            return acc;
        }, {});
        const uniqueDates = Array.from(new Set(Object.values(relevantTimelineData).flat().map(item => item.date))).sort();
        const totalPages = Math.ceil(uniqueDates.length / daysPerPage);
        const startIndex = page * daysPerPage;
        const endIndex = startIndex + daysPerPage;
        const visibleDates = uniqueDates.slice(startIndex, endIndex);

        // Timeline y rawStats filtrados
        const paginatedTimeline = relevantStates.map(state => ({
            id: state,
            schedule: (timelineData[state] || []).filter(item => visibleDates.includes(item.date))
        }));
        const filteredRawStats = {};
        Object.keys(stats).forEach(state => {
            const filteredIntervals = stats[state].intervals.filter(interval => visibleDates.includes(new Date(interval.start).toISOString().split('T')[0]));
            if (filteredIntervals.length) {
                filteredRawStats[state] = {
                    count: filteredIntervals.length,
                    totalDuration: filteredIntervals.reduce((sum, i) => sum + i.duration, 0),
                    intervals: filteredIntervals
                };
            }
        });

        // Cooling rate determinista: promedio de las fechas visibles
        let coolingRate = 'N/A';
        if (visibleDates.length) {
            // Si hay varias fechas, promedia los rates
            const rates = visibleDates.map(getCoolingRateByDate).map(r => parseInt(r));
            coolingRate = `${Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)}°C/h`;
        }

        const response = {
            success: true,
            pagination: {
                currentPage: page,
                totalPages,
                daysPerPage,
                totalDays: uniqueDates.length,
                visibleDates
            },
            summary: {
                numCycles: cycles,
                avgDurationCycles: `${avgCycleDuration} min`,
                numMilkings: milkingStats.count,
                avgDurationMilkings: `${avgMilkingDuration} min`,
                numAgitations: agitationStats.count,
                numEmptyings: emptyingStats.count,
                numWashings: washingStats.count,
                coolingRate
            },
            timeline: paginatedTimeline,
            rawStats: filteredRawStats
        };
        res.json(response);
    } catch (error) {
        devConsole.error('Error al consultar farm-activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas de actividades',
            error: error.message
        });
    }
});

/**
 * GET /postgres/tank-activities - Obtener actividades del tanque por día
 * Devuelve solo las actividades con fecha de comienzo y fin
 */
router.get('/tank-activities', async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const bucket = req.query.bucket || 'synthetic-farm-1';

        console.log('=== Tank Activities Request ===');
        console.log('Start Date:', startDate);
        console.log('Bucket:', bucket);

        // Primero, verificar qué datos hay en la tabla
        const countQuery = 'SELECT COUNT(*) as total FROM tank_state_intervals';
        const countResult = await connectPostgreSQL.query(countQuery);
        console.log('Total records in tank_state_intervals:', countResult.rows[0].total);

        // Ver algunos registros de ejemplo
        const sampleQuery = 'SELECT start_time, end_time, state FROM tank_state_intervals ORDER BY start_time LIMIT 10';
        const sampleResult = await connectPostgreSQL.query(sampleQuery);
        console.log('Sample records:', sampleResult.rows);

        // Verificar la estructura de la tabla
        const structureQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tank_state_intervals'
            ORDER BY ordinal_position
        `;
        const structureResult = await connectPostgreSQL.query(structureQuery);
        console.log('Table structure:', structureResult.rows);

        // Verificar fechas disponibles
        const dateRangeQuery = `
            SELECT 
                MIN(start_time) as earliest_date,
                MAX(start_time) as latest_date,
                COUNT(DISTINCT DATE(start_time)) as unique_dates
            FROM tank_state_intervals
        `;
        const dateRangeResult = await connectPostgreSQL.query(dateRangeQuery);
        console.log('Date range info:', dateRangeResult.rows[0]);

        let query = 'SELECT start_time, end_time, state FROM tank_state_intervals';
        const queryParams = [];
        
        if (startDate) {
            // Convertir fecha a formato YYYY-MM-DD para obtener todo el día
            const startDateStr = startDate.toISOString().split('T')[0];
            
            query += ' WHERE DATE(start_time) = $1';
            queryParams.push(startDateStr);
            
            console.log('Using specific date query with date:', startDateStr);
        } else {
            // Si no hay fecha, traer todos los registros de los últimos 7 días
            query += ' WHERE start_time >= NOW() - INTERVAL \'7 days\'';
            console.log('Using default query (last 7 days)');
        }
        
        query += ' ORDER BY start_time';
        
        console.log('Final Query:', query);
        console.log('Query Params:', queryParams);

        const result = await connectPostgreSQL.query(query, queryParams);
        const activities = result.rows;

        console.log('=== Database Results ===');
        console.log('Number of activities found:', activities.length);
        console.log('All activities found:', activities);

        // Transformar los datos al formato requerido
        const transformedActivities = activities.map(activity => ({
            startTime: activity.start_time,
            endTime: activity.end_time,
            state: activity.state.toUpperCase()
        }));

        console.log('=== Response ===');
        console.log('Transformed activities:', transformedActivities);
        console.log('Total activities:', transformedActivities.length);

        res.json(transformedActivities);
    } catch (error) {
        console.error('Error al consultar tank-activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las actividades del tanque',
            error: error.message
        });
    }
});

module.exports = router;
