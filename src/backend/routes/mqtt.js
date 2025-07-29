/**
 * Rutas para comunicación en tiempo real con MQTT
 * Maneja WebSockets para transmisión de datos de dispositivos IoT
 */

const WebSocket = require('ws');
const url = require('url');
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Farm = require('../models/Farm');
const { connectMQTT } = require('../config/connection');
const dataHandling = require('../utils/dataHandling');
const cacheService = require('../services/cache');

// Importar el sistema de console personalizado
const devConsole = require('../utils/console');

require('dotenv').config();

/**
 * Configura el servidor WebSocket para comunicación en tiempo real
 * @param {WebSocketServer} wss - Servidor WebSocket
 * @returns {Router} - Router de Express configurado
 */
module.exports = function(wss) {
  const router = express.Router();
  const client = connectMQTT();
  
  /**
   * Manejar mensajes MQTT y transmitir a clientes WebSocket relevantes
   * Parsea los mensajes MQTT y los reenvía a los clientes WebSocket suscritos
   */
  client.on('message', function (topic, message) {
    try {
      const rawData = message.toString();
      const [from, info] = topic.split('/');
      
      // Procesar datos usando la utilidad de Daniel
      const processedData = dataHandling.processData(topic, rawData);
      
      // Actualizar caché con los datos procesados
      if (processedData) {
        cacheService.updateSensorData(from, info, processedData);
      }
      
      // Preparar payload para WebSocket (mantener compatibilidad)
      const payload = JSON.parse(rawData.replace(/\\\\/g, '\\'));
      
      // Transmitir mensaje a clientes WebSocket relevantes
      wss.clients.forEach(function (ws) {
        if (ws.readyState === WebSocket.OPEN && ws.from === from && ws.info === info) {
          ws.send(JSON.stringify({ 
            topic, 
            payload,
            processedData: processedData // Incluir datos procesados
          }));
        }
      });
      
      devConsole.log(`MQTT message processed for topic: ${topic}`);
    } catch (error) {
      devConsole.error('Error processing MQTT message:', error);
    }
  });  
  
  /**
   * Función auxiliar para cerrar conexión con error
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} message - Mensaje de error
   */
  function closeWithError(ws, message) {
    ws.close(1008, message);
  }

  /**
   * Función auxiliar para verificar acceso a granja
   * @param {object} user - Usuario autenticado
   * @param {string} farmIdname - ID de la granja
   * @returns {boolean} - True si tiene acceso, false en caso contrario
   */
  async function checkFarmAccess(user, farmIdname) {
    if (user.role === 'Administrador') return true;
    
    const farm = await Farm.findOne({ idname: farmIdname });
    if (!farm) return false;
    
    return user.farms.some(farmId => farmId.toString() === farm._id.toString());
  }

  /**
   * Configurar manejo de conexiones WebSocket
   * Verifica autenticación y permisos de acceso a granjas
   */
  wss.on('connection', async function(ws, req) {
    const { query } = url.parse(req.url, true);
    const { from, info, token } = query;

    // Verificar token
    if (!token) {
      return closeWithError(ws, 'Token requerido');
    }

    // Verificar validez del token
    const mockReq = { headers: { authorization: token } };
    try {
      await verifyToken(mockReq, null, () => {
        ws.user = mockReq.user;
      });
    } catch (error) {
      return closeWithError(ws, 'Token inválido');
    }

    if (!ws.user) {
      return closeWithError(ws, 'Token inválido');
    }

    // Verificar acceso a la granja si se especifica
    if (from) {
      try {
        const hasAccess = await checkFarmAccess(ws.user, from);
        if (!hasAccess) {
          return closeWithError(ws, 'Acceso denegado a la granja');
        }
      } catch (error) {
        devConsole.error('Error verificando acceso a granja:', error);
        return closeWithError(ws, 'Error interno del servidor');
      }
    }

    // Suscribirse al topic MQTT si se proporcionan ambos parámetros
    if (from && info) {
      client.subscribe(`${from}/${info}`);
    }    ws.from = from;
    ws.info = info;
  });

  /**
   * Obtener datos del caché para un board específico
   * GET /realtime/cache/:farmId/:boardId
   */
  router.get('/cache/:farmId/:boardId', verifyToken, async (req, res) => {
    try {
      const { farmId, boardId } = req.params;
      
      // Verificar acceso a la granja
      const hasAccess = await checkFarmAccess(req.user, farmId);
      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acceso denegado a la granja' 
        });
      }
      
      const cachedData = cacheService.getBoardData(farmId, boardId);
      
      if (!cachedData) {
        return res.status(404).json({ 
          success: false, 
          message: 'No hay datos en caché para este board' 
        });
      }
      
      res.json({
        success: true,
        data: cachedData
      });
    } catch (error) {
      devConsole.error('Error getting cached data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  });

  return router;
};

// PRUEBA: wscat -c "ws://localhost:5001/realtime/data?from=farm-01&info=6_dof_imu&token=TU_JWT_TOKEN"