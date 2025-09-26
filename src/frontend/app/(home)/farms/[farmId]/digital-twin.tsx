/**
 * Página de prueba para funcionalidades de Daniel
 * Integra componentes básicos del frontend de Daniel López
 * Incluye selector de granjas, datos históricos y tiempo real
 */

'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarDateRangePicker, CalendarDateRangePickerRef } from '@/components/ui/date-range-picker';
import { CalendarIcon, Activity, Database, Thermometer, Droplets, Gauge, Weight, Zap, Play, Pause, ChevronLeft, ChevronRight, Radio, CircleX, Loader2, Sliders } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  useHistoricalData, 
  useRealTimeData, 
  useTankStatePrediction,
  useCachedData,
  type HistoricalDataParams
} from '@/services/data-service';
import TankModel from '@/components/tank-models/tank-model';
import TimeSeriesSlider from '@/components/timeline/time-series-slider';
import useAppDataStore from '@/stores/app-store';
import useTankStore from '@/stores/tank-store';
import useTankStates from '@/hooks/use-tank-states';
import { DateRange } from '@/components/ui/date-range-picker';

/**
 * Componente principal de la página de prueba de Daniel
 */
export default function PruebaDanielPage() {
  const { data: session } = useSession();
  const [selectedFarm] = useState<string>('synthetic-farm-1');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [boardIds] = useState<string[]>(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  const [selectedBoard] = useState<string>('6_dof_imu');
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [isSensorsTabVisible, setIsSensorsTabVisible] = useState(true);
  
  // Estado para el rango de fechas
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  // Ref para el DateRangePicker
  const dateRangePickerRef = useRef<CalendarDateRangePickerRef>(null);

  // Estado para filtros
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Variables de estado simples

  // Stores
  const { filters, mode, setMode, setFilters } = useAppDataStore((state) => state);
  const { selectedTank, setTankState } = useTankStore();

  // Hooks del servicio de Daniel
  const { 
    historicalData, 
    selectedHistoricalData, 
    loading,
    error, 
    fetchHistoricalData, 
    handleTimeSelected 
  } = useHistoricalData();
  const { data: realTimeData } = useRealTimeData(selectedFarm, selectedBoard, session?.accessToken || '');
  const { loadPrediction, loadRealTimePrediction } = useTankStatePrediction();
  const { loadCachedData } = useCachedData();

  // Hook para estados del tanque
  const {
    tankStates,
    tankStatesLoading,
    tankStatesError,
    fetchTankStates,
    retryFetchTankStates,
  } = useTankStates({
    filters: {
      selectedDate: filters.selectedDate || undefined,
      dateRange: dateRange && dateRange.from && dateRange.to ? {
        from: dateRange.from,
        to: dateRange.to
      } : null
    },
    boardIds,
    selectedFarm,
    selectedTank: selectedTank?.name || 'default-tank',
    mode, // Pasar el modo al hook
  });

  // Función para obtener el color del estado
  const getStateColor = (state: string) => {
    switch (state) {
      case 'MILKING': return 'bg-green-500';
      case 'COOLING': return 'bg-blue-500';
      case 'CLEANING': return 'bg-yellow-500';
      case 'EMPTY TANK': return 'bg-red-500';
      case 'MAINTENANCE': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Función para obtener el color de texto del estado
  const getStateTextColor = (state: string) => {
    switch (state) {
      case 'MILKING': return 'text-green-700 dark:text-green-400';
      case 'COOLING': return 'text-blue-700 dark:text-blue-400';
      case 'CLEANING': return 'text-yellow-700 dark:text-yellow-400';
      case 'EMPTY TANK': return 'text-red-700 dark:text-red-400';
      case 'MAINTENANCE': return 'text-purple-700 dark:text-purple-400';
      default: return 'text-gray-700 dark:text-gray-400';
    }
  };

  /**
   * Cargar datos históricos
   */
  const handleLoadHistoricalData = async () => {
    if (!selectedFarm || !selectedDate) return;

    const params: HistoricalDataParams = {
      farm: selectedFarm,
      date: selectedDate.toISOString().split('T')[0],
      boardIds: boardIds,
      tank: { height: 100 } // Altura del tanque en cm
    };

    // Loading historical data

    await fetchHistoricalData(params, session?.accessToken);
  };

  /**
   * Procesar datos reales para el modelo 3D
   */
  const processRealTimeDataForModel = () => {
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

  const modelData = processRealTimeDataForModel();

  // Process historical data to ensure correct structure
  const processHistoricalDataForModel = (historicalData: any) => {
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

  // Unified data processing for both modes
  const getUnifiedData = () => {
    if (mode === "realtime") {
      return {
        encoderData: modelData.encoderData,
        milkQuantityData: modelData.milkQuantityData,
        switchStatus: modelData.switchStatus,
        weightData: modelData.weightData,
        tankTemperaturesData: modelData.tankTemperaturesData,
        airQualityData: modelData.airQualityData,
        gyroscopeData: modelData.gyroscopeData,
      };
    } else {
      // Historical mode - SIMPLIFICADO
      
      // FORZAR extracción de datos históricos
      if (historicalData && typeof historicalData === 'object') {
        // Obtener todas las claves de tiempo disponibles (formato "HH:MM")
        const timeKeys = Object.keys(historicalData).filter(key => 
          key.includes(':') && historicalData[key]
        );
        
        if (timeKeys.length > 0) {
          // Si hay selectedTime específico, usarlo; sino usar la primera clave disponible
          let targetTime = selectedTime;
          
          if (!targetTime && selectedDate) {
            targetTime = selectedDate.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          // Buscar la clave más cercana o usar la primera disponible
          let selectedTimeKey = timeKeys[0]; // Default: primera disponible
          
          if (targetTime) {
            const foundKey = timeKeys.find(key => key === targetTime);
            if (foundKey) {
              selectedTimeKey = foundKey;
            } else {
              // Buscar el más cercano
              const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
              const targetTotalMinutes = targetHours * 60 + targetMinutes;
              
              selectedTimeKey = timeKeys.reduce((closest, current) => {
                const [currentHours, currentMinutes] = current.split(':').map(Number);
                const currentTotalMinutes = currentHours * 60 + currentMinutes;
                
                const [closestHours, closestMinutes] = closest.split(':').map(Number);
                const closestTotalMinutes = closestHours * 60 + closestMinutes;
                
                const currentDiff = Math.abs(currentTotalMinutes - targetTotalMinutes);
                const closestDiff = Math.abs(closestTotalMinutes - targetTotalMinutes);
                
                return currentDiff < closestDiff ? current : closest;
              });
            }
          }
          
          // Extraer y procesar datos del tiempo seleccionado
          const specificTimeData = historicalData[selectedTimeKey];
          if (specificTimeData) {
            return processHistoricalDataForModel({ [selectedTimeKey]: specificTimeData });
          }
        }
      }
      
      // Fallback final
      return processHistoricalDataForModel(selectedHistoricalData || historicalData);
    }
  };

  // FORZAR recálculo SIEMPRE que cambie cualquier dependencia
  const unifiedData = useMemo(() => {
    if (mode === "realtime") {
      return {
        encoderData: modelData.encoderData,
        milkQuantityData: modelData.milkQuantityData,
        switchStatus: modelData.switchStatus,
        weightData: modelData.weightData,
        tankTemperaturesData: modelData.tankTemperaturesData,
        airQualityData: modelData.airQualityData,
        gyroscopeData: modelData.gyroscopeData,
      };
    }
    
    // Historical mode - FORZAR extracción de datos
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
    
    // Fallback
    return processHistoricalDataForModel(selectedHistoricalData || historicalData);
  }, [mode, selectedTime, selectedDate, historicalData, selectedHistoricalData, modelData, filters.selectedDate, tankStates]);

  // Sensores disponibles
  const sensors = [
    { name: "MilkQuantity", icon: Droplets, label: "Cantidad de Leche" },
    { name: "TankTemperatures", icon: Thermometer, label: "Temperatura del Tanque" },
    { name: "MagneticSwitch", icon: Zap, label: "Interruptor Magnético" },
    { name: "Encoder", icon: Gauge, label: "Encoder" },
    { name: "Gyroscope", icon: Activity, label: "Giroscopio" },
    { name: "Weight", icon: Weight, label: "Peso" },
    { name: "AirQuality", icon: Database, label: "Calidad del Aire" },
  ];

  const handleCardSelect = (cardName: string) => {
    setSelectedData(cardName === selectedData ? null : cardName);
  };

  // Ya no necesario - se maneja en el efecto anterior

  // FORZAR recarga de datos históricos cuando cambie la fecha
  useEffect(() => {
    if (filters.selectedDate && mode === 'historical' && selectedFarm && session?.accessToken) {
      setSelectedDate(filters.selectedDate);
      
      // FORZAR carga de datos históricos del nuevo día
      const newDate = filters.selectedDate.toISOString().split('T')[0];
      

      const params: HistoricalDataParams = {
        farm: selectedFarm,
        date: newDate,
        boardIds: boardIds,
        tank: { height: 100 }
      };
      
      // RECARGAR datos del backend para el nuevo día
      fetchHistoricalData(params, session?.accessToken);
      fetchTankStates();
    }
  }, [filters.selectedDate, mode, selectedFarm, session?.accessToken]);

  // Effect to handle time selection
  useEffect(() => {
    if (selectedTime && mode === 'historical') {
      handleTimeSelected(selectedTime);
    }
  }, [selectedTime, handleTimeSelected, mode]);

  // Ya no necesario - se maneja en el useEffect anterior

  // Handler for time selection from the slider
  const handleTimeSelectionChange = (timeString: string) => {
    setSelectedTime(timeString);
  };

  return (
    <PageContainer>
      <div className="w-full mt-10 sm:mb-0 mb-20 max-h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Barra de control superior */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 z-10">
    
            {/* Toggle de modo */}
            <div className="md:col-span-3">
              <Card className="h-full bg-card border-border">
                <CardContent className="p-3 h-full flex items-center">
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant={mode === 'realtime' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('realtime')}
                      className="flex-1"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Tiempo Real
                    </Button>
                    <Button
                      variant={mode === 'historical' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('historical')}
                      className="flex-1"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botón de emergencia para tank activities */}
            <div className="md:col-span-1">
              <Card className="h-full bg-card border-border">
                <CardContent className="p-3 h-full flex items-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={fetchTankStates}
                    className="w-full"
                    disabled={tankStatesLoading}
                  >
                    {tankStatesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TEST'}
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Filtros históricos en franja horizontal - solo visible en modo histórico */}
          {mode === 'historical' && (
            <div className="w-full">
              <Card className="border-border bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Rango de fechas */}
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-xs font-medium text-foreground whitespace-nowrap">Rango:</Label>
                      <div className="flex-1 max-w-md">
                        <CalendarDateRangePicker
                          ref={dateRangePickerRef}
                          start={dateRange?.from}
                          end={dateRange?.to}
                          onDateRangeChange={(newDateRange) => {
                            if (newDateRange && newDateRange.from && newDateRange.to) {
                              const updatedDateRange = {
                                from: newDateRange.from,
                                to: newDateRange.to
                              };
                              setDateRange(updatedDateRange);
                            } else {
                              setDateRange(null);
                            }
                          }}
                          onApply={() => {
                            // No hacer validación aquí, se hará en el botón Aplicar del componente padre
                          }}
                        />
                      </div>
                    </div>

                    {/* Estado del tanque */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-foreground whitespace-nowrap">Estado:</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-32 text-xs bg-background border-border text-foreground">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="MILKING">Ordeño</SelectItem>
                          <SelectItem value="COOLING">Enfriamiento</SelectItem>
                          <SelectItem value="CLEANING">Limpieza</SelectItem>
                          <SelectItem value="EMPTY TANK">Tanque Vacío</SelectItem>
                          <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                </div>
                
                    {/* Botón de acción */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Obtener el valor actual del DateRangePicker usando el ref
                          if (dateRangePickerRef.current) {
                            dateRangePickerRef.current.applyChanges();
                          }
                        }}
                        className="text-xs"
                      >
                        Aplicar
                      </Button>
                </div>
              </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contenedor principal */}
          <div className="flex-1 flex overflow-hidden gap-4">
            {/* Panel de sensores (izquierda) */}
            {isSensorsTabVisible ? (
              <div className="w-64 h-full flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="sticky top-0 z-10 bg-card border-b border-border p-3">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold truncate text-foreground">Datos de Sensores</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSensorsTabVisible(false)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Ocultar panel"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="sr-only">Ocultar Panel</span>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span className="text-xs text-muted-foreground">Cargando...</span>
                    </div>
                  ) : (
                    <div className="w-full p-1">
                      <div className="flex flex-col gap-2 p-1 pt-0">
                        {sensors.map((sensor) => (
                          <Button
                            key={sensor.name}
                            onClick={() => handleCardSelect(sensor.name)}
                            variant="ghost"
                            className={cn(
                              "h-12 justify-between px-3 rounded-lg transition-all",
                              "hover:bg-accent/50 hover:shadow-sm",
                              "border border-border hover:border-primary/30",
                              "bg-background text-foreground",
                              selectedData === sensor.name && "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20",
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="p-1.5 bg-primary/10 rounded-md flex-shrink-0">
                                <sensor.icon size={16} className="text-primary" />
                              </div>
                              <span className="font-medium text-foreground text-xs">{sensor.label}</span>
                            </div>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full border-2 transition-colors flex-shrink-0",
                                selectedData === sensor.name
                                  ? "bg-primary border-primary"
                                  : "bg-transparent border-muted-foreground/30",
                              )}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-12 h-full flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="flex-1 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSensorsTabVisible(true)}
                    className="h-auto py-2 px-1 rounded-none shadow-sm flex flex-col gap-1 hover:bg-accent transition-all" 
                    title="Mostrar panel de sensores"
                  >
                    <ChevronRight className="h-4 w-4 text-foreground" />
                  </Button>
                </div>
              </div>
            )}

            {/* Modelo 3D (derecha) */}
            <div className="flex-1 flex flex-col bg-card rounded-lg shadow-sm overflow-hidden border border-border">
              <div className="flex-1 relative">
                <TankModel
                  mode={mode}
                  filters={{ dateRange }}
                  selectedHistoricalData={selectedHistoricalData}
                  historicalData={historicalData}
                  tankStates={tankStates}
                  tankStatesLoading={tankStatesLoading}
                  error={error}
                  handleTimeSelected={handleTimeSelected}
                  fetchHistoricalData={handleLoadHistoricalData}
                  selectedTime={selectedTime}
                  encoderData={unifiedData?.encoderData}
                  milkQuantityData={unifiedData?.milkQuantityData}
                  switchStatus={unifiedData?.switchStatus}
                  weightData={unifiedData?.weightData}
                  tankTemperaturesData={unifiedData?.tankTemperaturesData}
                  airQualityData={unifiedData?.airQualityData}
                  gyroscopeData={unifiedData?.gyroscopeData}
                  selectedData={selectedData}
                />
            </div>
            
              {/* Time Series Slider Container - Always visible in historical mode with date range */}
              {mode === "historical" && dateRange && !error && (
                <div className="px-4 py-3 border-t bg-gray-50 min-h-[140px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-[100px]">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Cargando datos históricos...
                      </span>
                    </div>
                  ) : tankStatesLoading ? (
                    <div className="flex items-center justify-center h-[100px]">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Cargando estados del tanque...
                      </span>
                  </div>
                  ) : tankStatesError ? (
                    <div className="flex items-center justify-center h-[100px]">
                      <div className="text-center">
                        <p className="text-sm text-red-500 mb-2">
                          Error al cargar estados del tanque. Selecciona otra fecha e intenta de nuevo
                        </p>
                        <button
                          onClick={retryFetchTankStates}
                          className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                          Intentar de nuevo
                        </button>
                      </div>
                    </div>
                  ) : tankStates && Object.keys(tankStates).length > 0 ? (
                    <TimeSeriesSlider
                      startDate={dateRange.from!}
                      endDate={dateRange.to!}
                      tankStateData={tankStates}
                      onTimeSelected={handleTimeSelectionChange}
                    />
                  ) : (
                    <div className="h-[100px]">
                      <div className="text-center mb-2">
                        <p className="text-sm text-muted-foreground">
                          No hay datos de estado del tanque disponibles para la fecha seleccionada
                        </p>
                    </div>
                      <TimeSeriesSlider
                        startDate={dateRange.from!}
                        endDate={dateRange.to!}
                        onTimeSelected={handleTimeSelectionChange}
                      />
                    </div>
                  )}
              </div>
            )}
              </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 