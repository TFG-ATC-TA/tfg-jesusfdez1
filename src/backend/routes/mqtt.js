const express = require('express');
const mqtt = require('mqtt');
const WebSocket = require('ws');
const url = require('url');
const { verifyToken } = require('../middleware/auth');

require('dotenv').config();

module.exports = function(wss) {
  const router = express.Router();

  const client = mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}`, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });
  client.on('connect', function () {
    console.log('Cliente MQTT conectado');
  });
  client.on('error', function (error) {
    console.error('Error del cliente MQTT:', error);
  });
  // Función para manejar suscripciones MQTT
  function handleMqttSubscription(from, info) {
    const mqttTopic = `${from}/${info}`;
    client.subscribe(mqttTopic, function (err) {
      if (!err) {
        console.log(`Suscripción MQTT a ${mqttTopic} exitosa`);
      } else {
        console.error(`Suscripción MQTT a ${mqttTopic} falló:`, err);
      }
    });
  }
  // Manejar mensajes MQTT y transmitir a clientes WebSocket relevantes
  client.on('message', function (topic, message) {
    const payload = JSON.parse(message.toString().replace(/\\\\/g, '\\')); // Convertir el string JSON a objeto JavaScript

    console.log(`Mensaje MQTT recibido en el tema ${topic}:`, payload);

    // Extraer 'from' e 'info' del tema MQTT
    const [from, info] = topic.split('/');

    // Transmitir mensaje a clientes WebSocket relevantes
    wss.clients.forEach(function (ws) {
      if (ws.readyState === WebSocket.OPEN && ws.from === from && ws.info === info) {
        ws.send(JSON.stringify({ topic, payload }));
      }
    });
  });  // Configurar manejo de conexiones WebSocket
  wss.on('connection', async function(ws, req) {
    const { query } = url.parse(req.url, true);
    console.log(query);
    const from = query.from;
    const info = query.info;
    const token = query.token;    // Verificar token antes de proceder
    if (!token) {
      console.log('Conexión WebSocket rechazada: No se proporcionó token');
      ws.close(1008, 'Token requerido');
      return;
    }    // Verificar validez del token usando el middleware existente
    const mockReq = { headers: { authorization: token } };
    let user = null;
    let tokenValid = false;

    try {
      await verifyToken(mockReq, null, () => {
        tokenValid = true;
        user = mockReq.user;
      });
    } catch (error) {
      tokenValid = false;
    }

    if (!tokenValid || !user) {
      console.log('Conexión WebSocket rechazada: Token inválido');
      ws.close(1008, 'Token inválido');
      return;
    }
    
    // Añadir información del usuario al WebSocket
    ws.user = user;
    console.log(`WebSocket autenticado para el usuario: ${user.id || user.email}`);

    if (from && info) {
      handleMqttSubscription(from, info);
    }    ws.from = from;
    ws.info = info;

    console.log(`Cliente WebSocket conectado para from: ${from}, info: ${info}`);

    ws.on('message', function (message) {
      console.log('Mensaje recibido:', message);
      // Manejar mensaje entrante aquí
    });
  });

  return router;
};

// PRUEBA: wscat -c "ws://localhost:5001/realtime/data?from=farm-01&info=6_dof_imu&token=TU_JWT_TOKEN"