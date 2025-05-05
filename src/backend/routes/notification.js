
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Farm = require('../models/Farm');
const Device = require('../models/Device');
const { verifyToken } = require('../middleware/auth');
const cors = require('cors');

router.use(cors());
router.use(express.json());

// GET /notification/list - Obtener notificaciones del usuario con paginación, búsqueda y estadísticas
router.get('/list', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const searchTerm = req.query.searchTerm || '';
    const typeFilter = req.query.type || '';
    const readFilter = req.query.read || ''; // 'true', 'false', or ''
    const farmFilter = req.query.farm || '';

    console.log('Solicitud de notificaciones:', { userId, page, limit, searchTerm, typeFilter, farmFilter });

    // Obtener información del usuario para verificar su rol
    const User = require('../models/User');
    const currentUser = await User.findById(userId).select('role');
    const isAdmin = currentUser && currentUser.role === 'Administrador';

    console.log('Usuario:', { userId, role: currentUser?.role, isAdmin });

    let farmIds = [];
    
    if (isAdmin) {
      // Si es administrador, puede acceder a todas las notificaciones
      console.log('Usuario administrador: acceso a todas las notificaciones');
    } else {
      // Si no es administrador, solo puede acceder a las notificaciones de sus granjas
      const userFarms = await Farm.find({ users: userId }).select('_id');
      farmIds = userFarms.map(farm => farm._id);
      
      console.log('Granjas del usuario:', farmIds);

      if (farmIds.length === 0) {
        return res.json({
          notifications: [],
          pagination: {
            currentPage: 0,
            totalPages: 0,
            totalNotifications: 0,
            limit: limit,
            hasNext: false,
            hasPrev: false
          },
          stats: {
            total: 0,
            info: 0,
            warning: 0,
            error: 0,
            unread: 0
          }
        });
      }
    }

    // Construir query base
    let query = {};
    
    // Solo filtrar por granjas si no es administrador
    if (!isAdmin) {
      query.farm = { $in: farmIds };
    }

    console.log('Query construida:', JSON.stringify(query, null, 2));

    // Filtros opcionales
    if (typeFilter) {
      const types = typeFilter.split(',').filter(t => t.trim() !== '');
      if (types.length > 0) {
        query.type = { $in: types };
      }
    }

    // Para el filtro de granja, buscar por nombre si se proporciona
    if (farmFilter && farmFilter !== 'all') {
      const farmNames = farmFilter.split(',').filter(f => f.trim() !== '');
      if (farmNames.length > 0) {
        let farmQuery = { name: { $in: farmNames } };
        
        // Si no es administrador, también filtrar por las granjas a las que tiene acceso
        if (!isAdmin) {
          farmQuery._id = { $in: farmIds };
        }
        
        const farmsByName = await Farm.find(farmQuery).select('_id');
        
        if (farmsByName.length > 0) {
          const selectedFarmIds = farmsByName.map(f => f._id);
          query.farm = { $in: selectedFarmIds };
        } else {
          // Si no se encuentra ninguna granja por nombre, no devolver resultados
          query.farm = null;
        }
      }
    }

    // Búsqueda por texto
    if (searchTerm) {
      query.$or = [
        { message: { $regex: searchTerm, $options: 'i' } },
        { type: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Obtener todas las notificaciones para estadísticas
    const allNotifications = await Notification.find(query)
      .populate('farm', 'name')
      .populate('equipment', 'name')
      .populate('device', 'boardId')
      .sort({ createdAt: -1 });

    console.log('Notificaciones encontradas:', allNotifications.length);

    // Calcular estadísticas
    const stats = {
      total: allNotifications.length,
      info: allNotifications.filter(n => n.type === 'info').length,
      warning: allNotifications.filter(n => n.type === 'warning').length,
      error: allNotifications.filter(n => n.type === 'error').length,
      unread: 0
    };

    // Agregar información de lectura y filtrar por estado de lectura
    const notificationsWithReadStatus = allNotifications.map(notification => {
      const notificationObj = notification.toObject();
      const readInfo = notification.read.find(r => r.userId.toString() === userId);
      notificationObj.isRead = readInfo ? readInfo.read : false;
      notificationObj.readDate = readInfo ? readInfo.readDate : null;
      
      // Solo contar las no leídas
      if (!notificationObj.isRead) {
        stats.unread++;
      }
      
      return notificationObj;
    });

    // Filtrar por estado de lectura si se especifica
    let filteredNotifications = notificationsWithReadStatus;
    if (readFilter !== '') {
      const isReadFilter = readFilter === 'true';
      filteredNotifications = notificationsWithReadStatus.filter(n => n.isRead === isReadFilter);
    }

    // Paginación
    const totalNotifications = filteredNotifications.length;
    const totalPages = Math.ceil(totalNotifications / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Si no hay notificaciones, enviar página 0
    const currentPage = totalNotifications === 0 ? 0 : page;


    // Formatear respuesta - solo enviar datos necesarios para el frontend
    const formattedNotifications = paginatedNotifications.map(notification => ({
      id: notification._id,
      type: notification.type,
      message: notification.message,
      read: notification.isRead,
      readDate: notification.readDate,
      farm: notification.farm ? notification.farm.name : 'N/A',
      equipment: notification.equipment ? notification.equipment.name : 'N/A',
      device: notification.device ? (notification.device.description || notification.device.boardId) : 'N/A',
      boardId: notification.device ? notification.device.boardId : null,
      createdAt: notification.createdAt
    }));


    res.json({
      notifications: formattedNotifications,
      pagination: {
        currentPage,
        totalPages,
        totalNotifications,
        limit,
        hasNext: currentPage > 0 && currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});


// PUT /notification/:id/mark-read - Marcar notificación como leída
router.put('/:id/mark-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: 'Notificación no encontrada' });

    const User = require('../models/User');
    const currentUser = await User.findById(userId).select('role');
    const isAdmin = currentUser && currentUser.role === 'Administrador';

    if (!isAdmin) {
      const userFarms = await Farm.find({ users: userId }).select('_id');
      const farmIds = userFarms.map(farm => farm._id.toString());
      if (!farmIds.includes(notification.farm.toString())) {
        return res.status(403).json({ message: 'No tienes acceso a esta notificación' });
      }
    }

    // Actualizar o crear registro de lectura
    const readInfo = notification.read.find(r => r.userId.toString() === userId);
    if (readInfo) {
      readInfo.read = true;
      readInfo.readDate = new Date();
    } else {
      notification.read.push({ userId, read: true, readDate: new Date() });
    }
    await notification.save();
    res.json({ message: 'Notificación marcada como leída', success: true });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;