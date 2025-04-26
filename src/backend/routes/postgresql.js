var express = require('express');
var router = express.Router();
const cors = require('cors');
const { verifyToken } = require('../middleware/auth');
const { connectPostgreSQL } = require('../config/connection');
require('dotenv').config();

/* Setup CORS */
router.use(cors());

// Función determinista para cooling rate según fecha
function getCoolingRateByDate(dateStr) {
    // Convierte la fecha a un número simple y genera un valor entre 12 y 18
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rate = 12 + (Math.abs(hash) % 7); // 12°C/h a 18°C/h
    return `${rate}°C/h`;
}

// Nueva ruta para obtener estadísticas de actividades de la granja
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
        console.error('Error al consultar farm-activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas de actividades',
            error: error.message
        });
    }
});

module.exports = router;
