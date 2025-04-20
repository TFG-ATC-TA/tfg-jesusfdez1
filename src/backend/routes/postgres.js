var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB
});

/* Setup CORS */
router.use(cors());

// Ruta de prueba para obtener todos los datos de tank_state_intervals
router.get('/test', async (req, res) => {
    try {
        const query = 'SELECT * FROM tank_state_intervals ORDER BY start_time';
        const result = await pool.query(query);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error al consultar tank_state_intervals:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los datos',
            error: error.message
        });
    }
});

// Nueva ruta para obtener estadísticas de actividades de la granja
router.get('/farm-activities', async (req, res) => {
    try {
        // Obtener parámetros de paginación de la query string
        const page = parseInt(req.query.page) || 0;
        const daysPerPage = parseInt(req.query.daysPerPage) || 4;
        
        const query = 'SELECT * FROM tank_state_intervals ORDER BY start_time';
        const result = await pool.query(query);
        
        // Procesar los datos para generar estadísticas y timeline
        const data = result.rows;
        
        // Función para calcular duración en minutos
        const getDurationMinutes = (startTime, endTime) => {
            const start = new Date(startTime);
            const end = new Date(endTime);
            return Math.round((end - start) / (1000 * 60));
        };
        
        // Calcular estadísticas por estado
        const stats = {};
        const timelineData = {};
        
        data.forEach(interval => {
            const state = interval.state;
            const duration = getDurationMinutes(interval.start_time, interval.end_time);
            
            if (!stats[state]) {
                stats[state] = {
                    count: 0,
                    totalDuration: 0,
                    intervals: []
                };
            }
            
            stats[state].count++;
            stats[state].totalDuration += duration;
            stats[state].intervals.push({
                start: interval.start_time,
                end: interval.end_time,
                duration: duration
            });
            
            // Preparar datos para timeline
            if (!timelineData[state]) {
                timelineData[state] = [];
            }
            
            const startDate = new Date(interval.start_time);
            const endDate = new Date(interval.end_time);
            
            timelineData[state].push({
                start: startDate.toTimeString().substr(0, 5), // HH:MM
                end: endDate.toTimeString().substr(0, 5), // HH:MM
                day: Math.floor((startDate - new Date('2025-04-03')) / (1000 * 60 * 60 * 24)) + 1,
                date: startDate.toISOString().split('T')[0]
            });
        });
        
        // Calcular estadísticas resumidas
        const milkingStats = stats['milking'] || { count: 0, totalDuration: 0 };
        const agitationStats = stats['maintenance'] || { count: 0, totalDuration: 0 };
        const emptyingStats = stats['emptying'] || { count: 0, totalDuration: 0 };
        const washingStats = stats['cleaning'] || { count: 0, totalDuration: 0 };
        
        // Calcular promedios
        const avgMilkingDuration = milkingStats.count > 0 ? Math.round(milkingStats.totalDuration / milkingStats.count) : 0;
        
        // Contar ciclos completos (secuencias de ordeño + enfriamiento)
        let cycles = 0;
        let totalCycleDuration = 0;
        const sortedIntervals = data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        for (let i = 0; i < sortedIntervals.length - 1; i++) {
            if (sortedIntervals[i].state === 'milking' && sortedIntervals[i + 1].state === 'cooling') {
                cycles++;
                const cycleDuration = getDurationMinutes(sortedIntervals[i].start_time, sortedIntervals[i + 1].end_time);
                totalCycleDuration += cycleDuration;
            }
        }          const avgCycleDuration = cycles > 0 ? Math.round(totalCycleDuration / cycles) : 0;
        
        // Obtener fechas únicas y aplicar paginación (solo de estados relevantes)
        const relevantStates = ['milking', 'maintenance', 'emptying', 'cleaning'];
        const relevantTimelineData = relevantStates.reduce((acc, state) => {
            if (timelineData[state]) {
                acc[state] = timelineData[state];
            }
            return acc;
        }, {});
        
        const uniqueDates = Array.from(new Set(
            Object.values(relevantTimelineData).flat().map(item => item.date)
        )).sort();
        
        const totalPages = Math.ceil(uniqueDates.length / daysPerPage);
        const startIndex = page * daysPerPage;
        const endIndex = startIndex + daysPerPage;
        const visibleDates = uniqueDates.slice(startIndex, endIndex);
          // Filtrar datos del timeline solo para las fechas visibles y estados relevantes
        const paginatedTimeline = relevantStates.map(state => ({
            id: state,
            schedule: (timelineData[state] || []).filter(item => visibleDates.includes(item.date))
        }));
        
        // Filtrar rawStats para incluir solo intervalos de las fechas visibles
        const filteredRawStats = {};
        Object.keys(stats).forEach(state => {
            const filteredIntervals = stats[state].intervals.filter(interval => {
                const intervalDate = new Date(interval.start).toISOString().split('T')[0];
                return visibleDates.includes(intervalDate);
            });
            
            if (filteredIntervals.length > 0) {
                const totalDuration = filteredIntervals.reduce((sum, interval) => sum + interval.duration, 0);
                filteredRawStats[state] = {
                    count: filteredIntervals.length,
                    totalDuration: totalDuration,
                    intervals: filteredIntervals
                };
            }
        });
        
        // Preparar respuesta simplificada en inglés
        const response = {
            success: true,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                daysPerPage: daysPerPage,
                totalDays: uniqueDates.length,
                visibleDates: visibleDates
            },
            summary: {
                numCycles: cycles,
                avgDurationCycles: `${avgCycleDuration} min`,
                numMilkings: milkingStats.count,
                avgDurationMilkings: `${avgMilkingDuration} min`,
                numAgitations: agitationStats.count,
                numEmptyings: emptyingStats.count,
                numWashings: washingStats.count,
                coolingRate: "15°C/h"
            },
            timeline: paginatedTimeline,
            rawStats: filteredRawStats
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error al consultar farm-activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas de actividades',
            error: error.message
        });
    }
});

module.exports = router;
