/**
 * Utilidad para procesamiento de datos MQTT
 * Adaptado del proyecto tfg-DaniLopez23
 */

const devConsole = require('./console');

const parseCommonData = (rawData) => {
  try {
    const dataObject = JSON.parse(rawData);
    return dataObject[dataObject.length - 1];
  } catch (error) {
    devConsole.error("Error parsing JSON:", error);
    return null;
  }
};

const getReadableDate = (timestamp) => {
  const date = new Date(timestamp * 1000);

  // Convertir a la zona horaria de Madrid y mostrar segundos
  const options = {
    timeZone: "Europe/Madrid", // Zona horaria de Madrid
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit", // Incluir segundos
    hour12: false, // Formato de 24 horas
  };

  const formattedDate = date.toLocaleString("en-GB", options); // Formato DD/MM/YYYY HH:mm:ss
  return formattedDate;
};

const baseStructure = (lastObject) => ({
  measurement: lastObject.measurement,
  tags: lastObject.tags,
  readableDate: getReadableDate(lastObject.timestamp),
  value: {}
});

const getTankTemperaturesData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: {
      submerged_temperature: lastObject.fields.submerged_temperature,
      surface_temperature: lastObject.fields.surface_temperature,
      over_surface_temperature: lastObject.fields.over_surface_temperature
    }
  };
};

const getGyroscopeData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields
  };
};

const getMilkQuantityData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.range,
  };
};

const getAirQualityData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields
  };
};

const getWeightData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.value
  };
};

const getMagneticSwitchData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.state
  };
};

const getEncoderData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.rpm
  };
};

const getBoardTemperatureData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.temperature
  };
};

const getBoardStatusData = (rawData) => {
  const lastObject = parseCommonData(rawData);
  if (!lastObject) return null;

  return {
    ...baseStructure(lastObject),
    value: lastObject.fields.status
  };
};

const topicHandlers = {
  "6_dof_imu": getGyroscopeData,
  "tank_temperature_probes": getTankTemperaturesData,
  "tank_distance": getMilkQuantityData,
  "air_quality": getAirQualityData,
  "weight": getWeightData,
  "magnetic_switch": getMagneticSwitchData,
  "encoder": getEncoderData,
  "board_temperature": getBoardTemperatureData,
  "board_status": getBoardStatusData,
};

const processData = (topic, rawData) => {
  const topicParts = topic.split("/");
  const topicName = topicParts[topicParts.length - 1];
  const handler = topicHandlers[topicName];

  if (!handler) {
    devConsole.log(`No handler for topic: ${topicName}`);
    return null;
  }

  try {
    return handler(rawData);
  } catch (error) {
    devConsole.error(`Error processing ${topicName}:`, error);
    return null;
  }
};

module.exports = { processData }; 