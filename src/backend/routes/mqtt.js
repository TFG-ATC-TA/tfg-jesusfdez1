const express = require('express');
const mqtt = require('mqtt');
const WebSocket = require('ws');
const url = require('url');
require('dotenv').config();

module.exports = function(wss) {
  const router = express.Router();

  const client = mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}`, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  client.on('connect', function () {
    console.log('MQTT client connected');
  });

  client.on('error', function (error) {
    console.error('MQTT client error:', error);
  });

  // Function to handle MQTT subscriptions
  function handleMqttSubscription(from, info) {
    const mqttTopic = `${from}/${info}`;
    client.subscribe(mqttTopic, function (err) {
      if (!err) {
        console.log(`MQTT subscription to ${mqttTopic} successful`);
      } else {
        console.error(`MQTT subscription to ${mqttTopic} failed:`, err);
      }
    });
  }

  // Handle MQTT messages and broadcast to relevant WebSocket clients
  client.on('message', function (topic, message) {
    const payload = JSON.parse(message.toString().replace(/\\\\/g, '\\')); // Convertir el string JSON a objeto JavaScript

    console.log(`Received MQTT message on topic ${topic}:`, payload);

    // Extract 'from' and 'info' from the MQTT topic
    const [from, info] = topic.split('/');

    // Broadcast message to relevant WebSocket clients
    wss.clients.forEach(function (ws) {
      if (ws.readyState === WebSocket.OPEN && ws.from === from && ws.info === info) {
        ws.send(JSON.stringify({ topic, payload }));
      }
    });
  });

  // Set up WebSocket connection handling
  wss.on('connection', function(ws, req) {
    const { query } = url.parse(req.url, true);
    console.log(query);
    const from = query.from;
    const info = query.info;

    if (from && info) {
      handleMqttSubscription(from, info);
    }

    ws.from = from;
    ws.info = info;

    console.log(`WebSocket client connected for from: ${from}, info: ${info}`);

    ws.on('message', function (message) {
      console.log('Received message:', message);
      // Handle incoming message here
    });
  });

  return router;
};

// TESTING: wscat -c "ws://localhost:5001/realtime/data?from=farm-01&info=6_dof_imu"