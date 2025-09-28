/**
 * Utilidades compartidas para el procesamiento de datos del gemelo digital
 * Contiene funciones reutilizables para procesar datos de sensores
 */

/**
 * Procesar datos reales para el modelo 3D
 */
export const processRealTimeDataForModel = (realTimeData: any[]) => {
  // Buscar datos de IMU (6_dof_imu)
  const imuData = realTimeData?.find((data: any) => data.topic?.includes('6_dof_imu'))?.processedData;
  
  // Buscar datos del giroscopio en datos históricos
  const gyroscopeData = realTimeData?.find((data: any) => 
    data.topic?.includes('gyroscope') || data.topic?.includes('6_dof_imu')
  )?.processedData;
  
  // Buscar otros tipos de datos con diferentes patrones de topic
  const encoderData = realTimeData?.find((data: any) => 
    data.topic?.includes('encoder')
  )?.processedData;
  
  const milkData = realTimeData?.find((data: any) => 
    data.topic?.includes('milk') || data.topic?.includes('tank_distance')
  )?.processedData;
  
  const switchData = realTimeData?.find((data: any) => 
    data.topic?.includes('switch') || data.topic?.includes('magnetic_switch')
  )?.processedData;
  
  const weightData = realTimeData?.find((data: any) => 
    data.topic?.includes('weight')
  )?.processedData;
  
  const temperatureData = realTimeData?.find((data: any) => 
    data.topic?.includes('temperature') || data.topic?.includes('temperature_probe')
  )?.processedData;
  
  const airData = realTimeData?.find((data: any) => 
    data.topic?.includes('air') || data.topic?.includes('air_quality')
  )?.processedData;

  // Procesar datos de IMU para simular encoder solo si están disponibles
  const processedEncoderData = imuData ? {
    value: {
      // Estructura para el visor 3D (claves numéricas) - solo velocidad
      "00": parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2)),
      "01": parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2)),
      // Estructura para el modal (propiedades nombradas) - con todos los valores
      angle: parseFloat((Math.atan2(imuData.value.accel_y, imuData.value.accel_x) * (180 / Math.PI)).toFixed(2)),
      position: parseFloat((Math.abs(imuData.value.accel_z) / 2).toFixed(2)), // Normalizar a 0-1
      speed: parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2))
    }
  } : undefined;

  // Procesar datos reales del encoder para que tengan estructura dual
  const processedRealEncoderData = encoderData ? {
    value: {
      // Estructura para el visor 3D (claves numéricas) - solo velocidad
      "00": parseFloat((encoderData.value?.speed || encoderData.value?.["00"] || 0).toFixed(2)),
      "01": parseFloat((encoderData.value?.speed || encoderData.value?.["01"] || 0).toFixed(2)),
      // Estructura para el modal (propiedades nombradas) - con todos los valores
      angle: parseFloat((encoderData.value?.angle || encoderData.value?.["00"] || 0).toFixed(2)),
      position: parseFloat((encoderData.value?.position || 0).toFixed(2)),
      speed: parseFloat((encoderData.value?.speed || encoderData.value?.["01"] || 0).toFixed(2))
    }
  } : undefined;

  // Procesar datos de peso - simular basado en acelerómetro si no hay datos reales
  const processedWeightData = weightData ? {
    value: typeof weightData.value === 'object' ? weightData.value : weightData.value
  } : imuData ? {
    value: Math.abs(imuData.value.accel_z) * 100 + 500 // Simular peso basado en aceleración Z
  } : undefined;

  // Procesar datos de calidad del aire - simular basado en IMU si no hay datos reales
  const processedAirData = airData ? {
    value: {
      humidity: airData.value?.humidity || airData.value,
      temperature: airData.value?.temperature
    }
  } : imuData ? {
    value: {
      humidity: Math.abs(imuData.value.accel_x) * 20 + 50, // Simular humedad
      temperature: Math.abs(imuData.value.accel_y) * 10 + 20 // Simular temperatura
    }
  } : undefined;

  // Procesar datos de temperatura del tanque - simular basado en IMU si no hay datos reales
  const processedTemperatureData = temperatureData ? {
    value: {
      over_surface_temperature: temperatureData.value?.over_surface_temperature || temperatureData.value,
      surface_temperature: temperatureData.value?.surface_temperature || temperatureData.value,
      submerged_temperature: temperatureData.value?.submerged_temperature || temperatureData.value
    },
    tags: temperatureData.tags,
    readableDate: temperatureData.readableDate
  } : imuData ? {
    value: {
      over_surface_temperature: Math.abs(imuData.value.accel_x) * 5 + 15,
      surface_temperature: Math.abs(imuData.value.accel_y) * 5 + 15,
      submerged_temperature: Math.abs(imuData.value.accel_z) * 5 + 15
    },
    tags: imuData.tags,
    readableDate: imuData.readableDate
  } : undefined;

  // Procesar datos de leche - simular basado en IMU si no hay datos reales
  const processedMilkData = milkData ? {
    value: milkData.value
  } : imuData ? {
    value: Math.abs(imuData.value.accel_z) * 50 + 25 // Simular cantidad de leche
  } : undefined;

  // Procesar datos de switch - simular basado en IMU si no hay datos reales
  const processedSwitchData = switchData ? {
    value: switchData.value
  } : imuData ? {
    value: Math.abs(imuData.value.accel_x) > 1.5 // Simular switch basado en aceleración
  } : undefined;

  // Procesar datos del giroscopio - usar datos reales o simular basado en IMU
  const processedGyroscopeData = gyroscopeData ? {
    value: {
      gyro_x: gyroscopeData.value?.gyro_x || gyroscopeData.value?.gyro_x_value || 0,
      gyro_y: gyroscopeData.value?.gyro_y || gyroscopeData.value?.gyro_y_value || 0,
      gyro_z: gyroscopeData.value?.gyro_z || gyroscopeData.value?.gyro_z_value || 0,
      accel_x: gyroscopeData.value?.accel_x || gyroscopeData.value?.accel_x_value || 0,
      accel_y: gyroscopeData.value?.accel_y || gyroscopeData.value?.accel_y_value || 0,
      accel_z: gyroscopeData.value?.accel_z || gyroscopeData.value?.accel_z_value || 0
    }
  } : imuData ? {
    value: {
      gyro_x: imuData.value.gyro_x,
      gyro_y: imuData.value.gyro_y,
      gyro_z: imuData.value.gyro_z,
      accel_x: imuData.value.accel_x,
      accel_y: imuData.value.accel_y,
      accel_z: imuData.value.accel_z
    }
  } : undefined;

  const result = {
    encoderData: processedRealEncoderData || processedEncoderData,
    milkQuantityData: processedMilkData,
    switchStatus: processedSwitchData,
    weightData: processedWeightData,
    tankTemperaturesData: processedTemperatureData,
    airQualityData: processedAirData,
    gyroscopeData: processedGyroscopeData
  };

  return result;
};

/**
 * Procesar datos históricos para el modelo 3D
 */
export const processHistoricalDataForModel = (historicalData: any) => {
  console.log('=== processHistoricalDataForModel Debug ===');
  console.log('Input Historical Data:', historicalData);
  
  if (!historicalData || typeof historicalData !== 'object') {
    console.log('No historical data or invalid format');
    return {};
  }

  // If it's already in the correct format (from selectedHistoricalData)
  if (historicalData.encoderData || historicalData.airQualityData) {
    console.log('Data already in correct format');
    // Asegurar que los datos del encoder tengan estructura dual
    if (historicalData.encoderData) {
      console.log('Processing encoder data for dual structure');
      const encoderValue = historicalData.encoderData.value;
      console.log('Original encoder value:', encoderValue);
      
      // Manejar diferentes estructuras de datos del encoder
      let angle, speed, position;
      
      // Si ya tiene estructura con "00" y "01" (datos históricos del backend)
      if (encoderValue["00"] !== undefined || encoderValue["01"] !== undefined) {
        // Usar los valores "00" y "01" como velocidad y ángulo
        speed = encoderValue["00"] || encoderValue["01"];
        angle = encoderValue["01"] || encoderValue["00"];
        position = 0; // No hay posición en datos históricos
      }
      // Si es un objeto con propiedades nombradas
      else if (typeof encoderValue === 'object' && encoderValue !== null) {
        angle = encoderValue.angle || encoderValue.angle_value;
        speed = encoderValue.speed || encoderValue.speed_value || encoderValue.rpm;
        position = encoderValue.position || encoderValue.position_value;
      }
      // Si es un valor directo (número)
      else if (typeof encoderValue === 'number') {
        speed = encoderValue; // Asumir que es velocidad si es un número directo
      }
      
      if (encoderValue && !encoderValue["00"] && !encoderValue["01"]) {
        // Si no tiene estructura dual, agregarla
        historicalData.encoderData.value = {
          // Estructura para el visor 3D (claves numéricas) - solo velocidad
          "00": parseFloat((speed || angle || 0).toFixed(2)),
          "01": parseFloat((speed || angle || 0).toFixed(2)),
          // Estructura para el modal (propiedades nombradas) - con todos los valores
          angle: parseFloat((angle || speed || 0).toFixed(2)),
          position: parseFloat((position || 0).toFixed(2)),
          speed: parseFloat((speed || angle || 0).toFixed(2))
        };

      } else if (encoderValue["00"] !== undefined || encoderValue["01"] !== undefined) {
        // Si ya tiene estructura "00"/"01", agregar propiedades nombradas para el modal
        historicalData.encoderData.value = {
          ...encoderValue, // Mantener estructura original
          // Agregar propiedades nombradas para el modal
          angle: parseFloat((encoderValue["01"] || encoderValue["00"] || 0).toFixed(2)),
          position: 0, // No hay posición en datos históricos
          speed: parseFloat((encoderValue["00"] || encoderValue["01"] || 0).toFixed(2))
        };
        console.log('Enhanced encoder data with named properties:', historicalData.encoderData.value);
      }
    }
    console.log('Returning processed data:', historicalData);
    return historicalData;
  }

  // If it's raw historical data from backend (with time keys)
  const timeKeys = Object.keys(historicalData);
  console.log('Time keys found:', timeKeys);
  if (timeKeys.length > 0) {
    const firstTime = timeKeys[0];
    const timeData = historicalData[firstTime];
    console.log('First time data:', timeData);
    
    // Process historical data to match real-time structure
    let processedEncoderData = timeData.encoderData;
    console.log('Raw encoder data:', processedEncoderData);
    if (processedEncoderData && processedEncoderData.value) {
      const encoderValue = processedEncoderData.value;
      console.log('Encoder value from time data:', encoderValue);
      
      // Manejar diferentes estructuras de datos del encoder
      let angle, speed, position;
      
      // Si ya tiene estructura con "00" y "01" (datos históricos del backend)
      if (encoderValue["00"] !== undefined || encoderValue["01"] !== undefined) {
        // Usar los valores "00" y "01" como velocidad y ángulo
        speed = encoderValue["00"] || encoderValue["01"];
        angle = encoderValue["01"] || encoderValue["00"];
        position = 0; // No hay posición en datos históricos
      }
      // Si es un objeto con propiedades nombradas
      else if (typeof encoderValue === 'object' && encoderValue !== null) {
        angle = encoderValue.angle || encoderValue.angle_value;
        speed = encoderValue.speed || encoderValue.speed_value || encoderValue.rpm;
        position = encoderValue.position || encoderValue.position_value;
      }
      // Si es un valor directo (número)
      else if (typeof encoderValue === 'number') {
        speed = encoderValue; // Asumir que es velocidad si es un número directo
      }
      
      // Si no tiene estructura dual, agregarla
      if (!encoderValue["00"] && !encoderValue["01"]) {
        processedEncoderData.value = {
          // Estructura para el visor 3D (claves numéricas) - solo velocidad
          "00": parseFloat((speed || angle || 0).toFixed(2)),
          "01": parseFloat((speed || angle || 0).toFixed(2)),
          // Estructura para el modal (propiedades nombradas) - con todos los valores
          angle: parseFloat((angle || speed || 0).toFixed(2)),
          position: parseFloat((position || 0).toFixed(2)),
          speed: parseFloat((speed || angle || 0).toFixed(2))
        };
  
      } else {
        // Si ya tiene estructura "00"/"01", agregar propiedades nombradas para el modal
        processedEncoderData.value = {
          ...encoderValue, // Mantener estructura original
          // Agregar propiedades nombradas para el modal
          angle: parseFloat((encoderValue["01"] || encoderValue["00"] || 0).toFixed(2)),
          position: 0, // No hay posición en datos históricos
          speed: parseFloat((encoderValue["00"] || encoderValue["01"] || 0).toFixed(2))
        };
  
      }
    }
    
    const processedData = {
      encoderData: processedEncoderData,
      milkQuantityData: timeData.milkQuantityData ? {
        ...timeData.milkQuantityData,
        value: timeData.milkQuantityData.value // El valor viene directamente en datos históricos
      } : undefined,
      switchStatus: timeData.switchStatus ? {
        ...timeData.switchStatus,
        value: timeData.switchStatus.value // El valor viene directamente en datos históricos
      } : undefined,
      weightData: timeData.weightData ? {
        ...timeData.weightData,
        value: timeData.weightData.value // El valor viene directamente en datos históricos
      } : undefined,
      tankTemperaturesData: timeData.tankTemperaturesData ? {
        ...timeData.tankTemperaturesData,
        value: {
          // Mapear campos de temperatura específicos
          surface_temperature: timeData.tankTemperaturesData.value?.surface_temperature,
          over_surface_temperature: timeData.tankTemperaturesData.value?.over_surface_temperature,
          submerged_temperature: timeData.tankTemperaturesData.value?.submerged_temperature
        }
      } : undefined,
      airQualityData: timeData.airQualityData ? {
        ...timeData.airQualityData,
        value: {
          // Extraer humidity y temperature de los datos históricos
          humidity: timeData.airQualityData.value?.heat_compensated_humidity || 
                   timeData.airQualityData.value?.raw_humidity ||
                   timeData.airQualityData.value?.humidity,
          temperature: timeData.airQualityData.value?.heat_compensated_temperature || 
                      timeData.airQualityData.value?.raw_temperature ||
                      timeData.airQualityData.value?.temperature
        }
      } : undefined,
      gyroscopeData: timeData.gyroscopeData ? {
        ...timeData.gyroscopeData,
        value: {
          // Extraer datos del giroscopio de los datos históricos
          gyro_x: timeData.gyroscopeData.value?.gyro_x,
          gyro_y: timeData.gyroscopeData.value?.gyro_y,
          gyro_z: timeData.gyroscopeData.value?.gyro_z,
          accel_x: timeData.gyroscopeData.value?.accel_x,
          accel_y: timeData.gyroscopeData.value?.accel_y,
          accel_z: timeData.gyroscopeData.value?.accel_z
        }
      } : undefined,
    };

    return processedData;
  }

  return {};
};

/**
 * Obtener datos unificados para el modelo 3D
 * Separación clara entre modo tiempo real e histórico
 */
export const getUnifiedData = (
  mode: string,
  realTimeData: any[],
  historicalData: any,
  selectedHistoricalData: any,
  selectedTime: string | null,
  selectedDate: Date | undefined
) => {
  // MODO TIEMPO REAL: Solo usar datos de WebSocket
  if (mode === "realtime") {
    console.log('=== MODO TIEMPO REAL: Usando datos de WebSocket ===');
    return processRealTimeDataForModel(realTimeData);
  }
  
  // MODO HISTÓRICO: Solo usar datos de la API histórica
  console.log('=== MODO HISTÓRICO: Usando datos de API histórica ===');
  
  if (historicalData && typeof historicalData === 'object') {
    const timeKeys = Object.keys(historicalData).filter(key => 
      key.includes(':') && historicalData[key]
    );
    
    if (timeKeys.length > 0) {
      // Usar el primer tiempo disponible por defecto
      let selectedTimeKey = timeKeys[0];
      
      // Si hay selectedTime, buscar el más cercano
      if (selectedTime) {
        const foundKey = timeKeys.find(key => key === selectedTime);
        if (foundKey) {
          selectedTimeKey = foundKey;
        }
      } else if (selectedDate) {
        // Si no hay selectedTime pero sí selectedDate, usar hora de selectedDate
        const targetTime = selectedDate.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        const foundKey = timeKeys.find(key => key === targetTime);
        if (foundKey) {
          selectedTimeKey = foundKey;
        }
      }
      
      // Extraer datos del tiempo seleccionado
      const specificTimeData = historicalData[selectedTimeKey];
      if (specificTimeData) {
        return processHistoricalDataForModel({ [selectedTimeKey]: specificTimeData });
      }
    }
  }
  
  // Fallback para datos históricos
  return processHistoricalDataForModel(selectedHistoricalData || historicalData);
};
