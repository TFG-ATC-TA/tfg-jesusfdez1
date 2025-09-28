'use client'

import { useState, useRef, useEffect } from 'react';
import TemperatureGyrocopeChart from '@/components/charts/temperature-gyroscope-chart';
import { CalendarDateRangePicker, CalendarDateRangePickerRef, DateRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import DairyTimeline from "@/components/charts/dairy-timeline-chart";
import AirQualityChart from "@/components/charts/air-quality-chart";
import AccelerometerChart from "@/components/charts/accelerometer-chart";
import TemperatureGyroscopeLive from "@/components/charts/temperature-gyroscope-live-chart";
import { Farm } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { useSession } from 'next-auth/react';

export default function Statistics({ farmData }: { farmData: Farm }) {
  const { data: session } = useSession();
  
  // Ref para el CalendarDateRangePicker
  const dateRangePickerRef = useRef<CalendarDateRangePickerRef>(null);
  
  // Date range state
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const initialDateRange = { 
    from: new Date(yesterday), 
    to: new Date(yesterday.setHours(23, 59, 59, 999))
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(initialDateRange);

  // Gemelo digital states
  const [selectedFarm] = useState<string>(farmData.idname);
  
  console.log('=== Component Initialization ===');
  console.log('Farm Data:', farmData);
  console.log('Selected Farm:', selectedFarm);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [boardIds] = useState<string[]>(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  const [selectedBoard] = useState<string>('6_dof_imu');
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [isSensorsTabVisible, setIsSensorsTabVisible] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
      dateRange: appliedDateRange && appliedDateRange.from && appliedDateRange.to ? {
        from: appliedDateRange.from,
        to: appliedDateRange.to
      } : null
    },
    boardIds,
    selectedFarm,
    selectedTank: selectedTank?.name || 'default-tank',
  });

  // Effect to load historical data when applied date range changes
  useEffect(() => {
    console.log('=== Effect triggered ===');
    console.log('Applied Date Range:', appliedDateRange);
    console.log('Session Token:', session?.accessToken ? 'Present' : 'Missing');
    
    if (appliedDateRange?.from && appliedDateRange?.to && session?.accessToken) {
      console.log('=== Conditions met, loading data ===');
      handleLoadHistoricalData();
      setSelectedTime(null); // Resetea el tiempo seleccionado
    } else {
      console.log('=== Conditions not met ===');
      console.log('Has from date:', !!appliedDateRange?.from);
      console.log('Has to date:', !!appliedDateRange?.to);
      console.log('Has session token:', !!session?.accessToken);
    }
  }, [appliedDateRange?.from, appliedDateRange?.to, session?.accessToken]);

  // 2. Cuando llegan nuevos datos históricos, selecciona el primer timestamp
  useEffect(() => {
    if (historicalData && Object.keys(historicalData).length > 0) {
      const timeKeys = Object.keys(historicalData);
      console.log('Available time keys:', timeKeys);
      
      // Select the first available timestamp
      const firstTime = timeKeys[0];
      console.log('Selected first time:', firstTime);
      
      setSelectedTime(firstTime);
      if (typeof handleTimeSelected === 'function') {
        handleTimeSelected(firstTime);
      }
    }
  }, [historicalData, handleTimeSelected]);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    console.log('=== Date Range Changed ===');
    console.log('New Date Range:', newDateRange);
    setDateRange(newDateRange);
    setAppliedDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    console.log('=== Apply Date Range ===');
    console.log('Current Date Range:', dateRange);
    console.log('Current Applied Date Range:', appliedDateRange);
    
    if (dateRangePickerRef.current) {
      dateRangePickerRef.current.applyChanges();
    }
  };

  const handleLoadHistoricalData = async () => {
    if (!selectedFarm || !appliedDateRange?.from) {
      console.error('Missing required parameters:', { selectedFarm, appliedDateRange });
      return;
    }

    if (!session?.accessToken) {
      console.error('No session token available');
      return;
    }

    const params: HistoricalDataParams = {
      farm: selectedFarm,
      date: appliedDateRange.from.toISOString().split('T')[0],
      boardIds: boardIds,
      // Si tu backend lo requiere, añade:
      // tank: { height: 100 }
    };

    console.log('=== Loading Historical Data ===');
    console.log('Params sent to backend:', params);
    console.log('Selected Farm:', selectedFarm);
    console.log('Selected Date:', appliedDateRange.from);
    console.log('Board IDs:', boardIds);
    console.log('Session token available:', !!session?.accessToken);

    try {
      await fetchHistoricalData(params, session?.accessToken);
      console.log('Historical data loaded successfully');
    } catch (error: unknown) {
      console.error('=== Error Loading Historical Data ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : undefined);
      
      // Ensure we always have a clear error message
      let errorMessage = 'Error desconocido al cargar datos históricos';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      }
      
      console.error('Final error message:', errorMessage);
      
      // You can also set a global error state here if needed
      // setGlobalError(errorMessage);
    }
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
      return historicalData;
    }

    // If it's raw historical data from backend (with time keys)
    const timeKeys = Object.keys(historicalData);
    console.log('Time keys found:', timeKeys);
    
    if (timeKeys.length > 0) {
      // Check if we have data from multiple days (ISO date format)
      const hasMultipleDays = timeKeys.some(key => key.includes('T') || key.includes('-'));
      
      if (hasMultipleDays) {
        // Group data by day to allow navigation between days
        const groupedByDay: Record<string, any> = {};
        
        timeKeys.forEach(timeKey => {
          let dateStr = '';
          
          // Parse the time key to extract the date
          if (timeKey.includes('T')) {
            // ISO string format
            dateStr = timeKey.split('T')[0];
          } else if (timeKey.includes('-')) {
            // Date format like "2024-06-10"
            dateStr = timeKey.split(' ')[0]; // Take only the date part
          } else {
            // Time-only format like "12:00", use current date as fallback
            dateStr = new Date().toISOString().split('T')[0];
          }
          
          if (!groupedByDay[dateStr]) {
            groupedByDay[dateStr] = {};
          }
          
          // Store the time data under the date
          groupedByDay[dateStr][timeKey] = historicalData[timeKey];
        });
        
        console.log('Grouped data by day:', groupedByDay);
        
        // Return the first day's data for the 3D model
        const firstDay = Object.keys(groupedByDay)[0];
        const firstTime = Object.keys(groupedByDay[firstDay])[0];
        const timeData = groupedByDay[firstDay][firstTime];
        
        const processedData = {
          encoderData: timeData.encoderData,
          milkQuantityData: timeData.milkQuantityData,
          switchStatus: timeData.switchStatus,
          weightData: timeData.weightData,
          tankTemperaturesData: timeData.tankTemperaturesData,
          airQualityData: timeData.airQualityData,
          gyroscopeData: timeData.gyroscopeData,
        };
        
        console.log('Processed data for 3D model:', processedData);
        return processedData;
      } else {
        // Single day data, process as before
        const firstTime = timeKeys[0];
        const timeData = historicalData[firstTime];
        
        const processedData = {
          encoderData: timeData.encoderData,
          milkQuantityData: timeData.milkQuantityData,
          switchStatus: timeData.switchStatus,
          weightData: timeData.weightData,
          tankTemperaturesData: timeData.tankTemperaturesData,
          airQualityData: timeData.airQualityData,
          gyroscopeData: timeData.gyroscopeData,
        };
        
        console.log('Single day processed data:', processedData);
        return processedData;
      }
    }

    console.log('No valid data structure found');
    return {};
  };

    // Unified data processing for historical mode
  const getUnifiedData = () => {
    console.log('=== Getting Unified Data ===');
    console.log('Selected Historical Data:', selectedHistoricalData);
    console.log('Historical Data:', historicalData);
    console.log('Applied Date Range:', appliedDateRange);
    
    // Historical mode - always use historical data in this tab
    const historicalDataToProcess = selectedHistoricalData || historicalData;

    const processedData = processHistoricalDataForModel(historicalDataToProcess);
    console.log('Processed Data:', processedData);

    // Si no hay datos procesados y tenemos un rango de fechas aplicado, crear datos por defecto basados en IMU
    if (!processedData.encoderData && !processedData.airQualityData && appliedDateRange) {
      console.log('=== No processed data found, using IMU fallback ===');
      const imuData = realTimeData?.find((data: any) => data.topic?.includes('6_dof_imu'))?.processedData;

      if (imuData) {
        console.log('=== Using IMU data for fallback ===');
        return {
          encoderData: {
            value: {
              "00": parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2)),
              "01": parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2)),
              angle: parseFloat((Math.atan2(imuData.value.accel_y, imuData.value.accel_x) * (180 / Math.PI)).toFixed(2)),
              position: parseFloat((Math.abs(imuData.value.accel_z) / 2).toFixed(2)),
              speed: parseFloat((Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10).toFixed(2))
            }
          },
          milkQuantityData: {
            value: Math.abs(imuData.value.accel_z) * 50 + 25
          },
          switchStatus: {
            value: Math.abs(imuData.value.accel_x) > 1.5
          },
          weightData: {
            value: Math.abs(imuData.value.accel_z) * 100 + 500
          },
          tankTemperaturesData: {
            value: {
              over_surface_temperature: Math.abs(imuData.value.accel_x) * 5 + 15,
              surface_temperature: Math.abs(imuData.value.accel_y) * 5 + 15,
              submerged_temperature: Math.abs(imuData.value.accel_z) * 5 + 15
            },
            tags: imuData.tags,
            readableDate: imuData.readableDate
          },
          airQualityData: {
            value: {
              humidity: Math.abs(imuData.value.accel_x) * 20 + 50,
              temperature: Math.abs(imuData.value.accel_y) * 10 + 20
            }
          },
          gyroscopeData: {
            value: {
              gyro_x: imuData.value.gyro_x,
              gyro_y: imuData.value.gyro_y,
              gyro_z: imuData.value.gyro_z,
              accel_x: imuData.value.accel_x,
              accel_y: imuData.value.accel_y,
              accel_z: imuData.value.accel_z
            }
          }
        };
      } else {
        console.log('=== No IMU data available, using static fallback ===');
        // Static fallback data when no IMU data is available
        return {
          encoderData: {
            value: {
              "00": 0,
              "01": 0,
              angle: 0,
              position: 0,
              speed: 0
            }
          },
          milkQuantityData: {
            value: 0
          },
          switchStatus: {
            value: false
          },
          weightData: {
            value: 0
          },
          tankTemperaturesData: {
            value: {
              over_surface_temperature: 20,
              surface_temperature: 20,
              submerged_temperature: 20
            },
            tags: {},
            readableDate: new Date().toISOString()
          },
          airQualityData: {
            value: {
              humidity: 50,
              temperature: 20
            }
          },
          gyroscopeData: {
            value: {
              gyro_x: 0,
              gyro_y: 0,
              gyro_z: 0,
              accel_x: 0,
              accel_y: 0,
              accel_z: 0
            }
          }
        };
      }
    }

    console.log('=== Final processed data ===', processedData);
    return processedData;
  };

  const unifiedData = getUnifiedData();

  const handleTimeSelectionChange = (timeString: string) => {
    console.log('Time selection changed to:', timeString);
    setSelectedTime(timeString);
    // Update selectedHistoricalData when time changes
    if (timeString && handleTimeSelected) {
      handleTimeSelected(timeString);
    }
  };

  const handleCardSelect = (cardName: string) => {
    setSelectedData(cardName === selectedData ? null : cardName);
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="charts">Tiempo Real</TabsTrigger>
          <TabsTrigger value="digital-twin">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-green-600 rounded-full"></div>
              <h3 className="text-xl font-semibold">Datos en tiempo real</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground pl-4 mb-7">Monitorización en vivo de sensores activos</p>
              <div className="grid grid-cols-1 gap-4 pt-0">
                <AirQualityChart bucket={farmData.idname} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AccelerometerChart bucket={farmData.idname} />
                  <TemperatureGyroscopeLive bucket={farmData.idname} />
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="border-t border-border"></div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
              <h3 className="text-xl font-semibold">Gemelo digital</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground pl-4 mb-7">Visualización 3D del tanque con datos en tiempo real</p>
            </div>
          </div>

          <div className="w-full mt-10 sm:mb-0 mb-20 max-h-screen overflow-y-auto">
            <div className="space-y-6">
             

              <div className="flex-1 flex overflow-hidden gap-4">
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
                            {[
                              { name: "MilkQuantity", icon: Droplets, label: "Cantidad de Leche" },
                              { name: "TankTemperatures", icon: Thermometer, label: "Temperatura del Tanque" },
                              { name: "MagneticSwitch", icon: Zap, label: "Interruptor Magnético" },
                              { name: "Encoder", icon: Gauge, label: "Encoder" },
                              { name: "Gyroscope", icon: Activity, label: "Giroscopio" },
                              { name: "Weight", icon: Weight, label: "Peso" },
                              { name: "AirQuality", icon: Database, label: "Calidad del Aire" },
                            ].map((sensor) => (
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

                <div className="flex-1 flex flex-col bg-card rounded-lg shadow-sm overflow-hidden border border-border">
                  <div className="flex-1 relative">
                    <TankModel
                      mode="realtime"
                      filters={{ dateRange }}
                      selectedHistoricalData={selectedHistoricalData}
                      historicalData={historicalData}
                      error={error}
                      handleTimeSelected={handleTimeSelectionChange}
                      fetchHistoricalData={handleLoadHistoricalData}
                      selectedTime={selectedTime}
                      encoderData={modelData.encoderData}
                      milkQuantityData={modelData.milkQuantityData}
                      switchStatus={modelData.switchStatus}
                      weightData={modelData.weightData}
                      tankTemperaturesData={modelData.tankTemperaturesData}
                      airQualityData={modelData.airQualityData}
                      gyroscopeData={modelData.gyroscopeData}
                      selectedData={selectedData}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="digital-twin" className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-semibold">Datos históricos</h3>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDateRangePicker
              ref={dateRangePickerRef}
              start={dateRange?.from}
              end={dateRange?.to}
              onDateRangeChange={handleDateRangeChange}
            />
            <Button 
              variant="default" 
              size="default"
              onClick={handleApplyDateRange}
              className="h-9 shrink-0"
            >
              <PaperPlaneIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground pl-4 mb-4">Análisis de tendencias basado en el rango de fechas seleccionado</p>
          
          <div className="grid grid-cols-1 gap-4 pt-0">
            <TemperatureGyrocopeChart 
              key={`${appliedDateRange?.from}-${appliedDateRange?.to}`} 
              bucket={farmData.idname} 
              startDate={appliedDateRange?.from} 
              endDate={appliedDateRange?.to} 
            />
            <DairyTimeline
              bucket={farmData.idname}
              startDate={appliedDateRange?.from}
              endDate={appliedDateRange?.to}
            />                
          </div>
        </div>
      </div>

      <div className="py-4">
        <div className="border-t border-border"></div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
              <h3 className="text-xl font-semibold">Gemelo digital</h3>
        </div>
        <div>
              <p className="text-sm text-muted-foreground pl-4 mb-7">Visualización 3D del tanque con datos históricos</p>
            </div>
          </div>

          <div className="w-full mt-10 sm:mb-0 mb-20 max-h-screen overflow-y-auto">
            <div className="space-y-6">

              <div className="flex-1 flex overflow-hidden gap-4">
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
                            {[
                              { name: "MilkQuantity", icon: Droplets, label: "Cantidad de Leche" },
                              { name: "TankTemperatures", icon: Thermometer, label: "Temperatura del Tanque" },
                              { name: "MagneticSwitch", icon: Zap, label: "Interruptor Magnético" },
                              { name: "Encoder", icon: Gauge, label: "Encoder" },
                              { name: "Gyroscope", icon: Activity, label: "Giroscopio" },
                              { name: "Weight", icon: Weight, label: "Peso" },
                              { name: "AirQuality", icon: Database, label: "Calidad del Aire" },
                            ].map((sensor) => (
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

                <div className="flex-1 flex flex-col bg-card rounded-lg shadow-sm overflow-hidden border border-border">
                  <div className="flex-1 relative">
                    <TankModel
                      mode="historical"
                      filters={{ dateRange: appliedDateRange }}
                      selectedHistoricalData={selectedHistoricalData}
                      historicalData={historicalData}
                      error={error}
                      handleTimeSelected={handleTimeSelectionChange}
                      fetchHistoricalData={handleLoadHistoricalData}
                      selectedTime={selectedTime}
                      encoderData={unifiedData.encoderData}
                      milkQuantityData={unifiedData.milkQuantityData}
                      switchStatus={unifiedData.switchStatus}
                      weightData={unifiedData.weightData}
                      tankTemperaturesData={unifiedData.tankTemperaturesData}
                      airQualityData={unifiedData.airQualityData}
                      gyroscopeData={unifiedData.gyroscopeData}
                      selectedData={selectedData}
                    />
                  </div>
                  
                  {appliedDateRange && !error && (
                    <div className="px-4 py-3 border-t bg-card min-h-[140px]">
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
                          startDate={appliedDateRange.from!}
                          endDate={appliedDateRange.to!}
                          tankStateData={tankStates}
                          onTimeSelected={handleTimeSelectionChange}
                        />
                      ) : historicalData && Object.keys(historicalData).length > 0 ? (
                        <TimeSeriesSlider
                          startDate={appliedDateRange.from!}
                          endDate={appliedDateRange.to!}
                          onTimeSelected={handleTimeSelectionChange}
                        />
                      ) : (
                        <div className="h-[100px]">
                          <div className="text-center mb-2">
                            <p className="text-sm text-muted-foreground">
                              No hay datos históricos disponibles para el período de tiempo seleccionado
                            </p>
                          </div>
                          <TimeSeriesSlider
                            startDate={appliedDateRange.from!}
                            endDate={appliedDateRange.to!}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
