/**
 * Página de prueba para funcionalidades de Daniel
 * Integra componentes básicos del frontend de Daniel López
 * Incluye selector de granjas, datos históricos y tiempo real
 */

'use client'

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/services/daniel-service';
import TankModel from '@/components/tank-models/tank-model';

/**
 * Componente principal de la página de prueba de Daniel
 */
export default function PruebaDanielPage() {
  const { data: session } = useSession();
  const [selectedFarm] = useState<string>('synthetic-farm-1');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [boardIds] = useState<string[]>(['01', '02']);
  const [selectedBoard] = useState<string>('6_dof_imu');
  const [mode, setMode] = useState<'realtime' | 'historical'>('realtime');
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [isSensorsTabVisible, setIsSensorsTabVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined } | null>(null);

  // Hooks del servicio de Daniel
  const { loading: historicalLoading } = useHistoricalData();
  const { data: realTimeData } = useRealTimeData(selectedFarm, selectedBoard, session?.accessToken || '');
  const { loadPrediction, loadRealTimePrediction } = useTankStatePrediction();
  const { loadCachedData } = useCachedData();

  // Datos simulados para estados del tanque
  const [tankStates] = useState([
    { start: '08:00', end: '10:30', state: 'MILKING', color: 'bg-green-500' },
    { start: '10:30', end: '12:00', state: 'COOLING', color: 'bg-blue-500' },
    { start: '12:00', end: '14:00', state: 'CLEANING', color: 'bg-yellow-500' },
    { start: '14:00', end: '16:30', state: 'EMPTY TANK', color: 'bg-red-500' },
    { start: '16:30', end: '18:00', state: 'MAINTENANCE', color: 'bg-purple-500' },
    { start: '18:00', end: '20:00', state: 'MILKING', color: 'bg-green-500' },
    { start: '20:00', end: '22:00', state: 'COOLING', color: 'bg-blue-500' },
    { start: '22:00', end: '00:00', state: 'CLEANING', color: 'bg-yellow-500' }
  ]);

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

    // await loadHistoricalData(params, session?.accessToken);
  };

  /**
   * Procesar datos reales para el modelo 3D
   */
  const processRealTimeDataForModel = () => {
    // Buscar datos de IMU (6_dof_imu)
    const imuData = realTimeData?.find((data: any) => data.topic?.includes('6_dof_imu'))?.processedData;
    
    // Buscar otros tipos de datos
    const encoderData = realTimeData?.find((data: any) => data.topic?.includes('encoder'))?.processedData;
    const milkData = realTimeData?.find((data: any) => data.topic?.includes('milk'))?.processedData;
    const switchData = realTimeData?.find((data: any) => data.topic?.includes('switch'))?.processedData;
    const weightData = realTimeData?.find((data: any) => data.topic?.includes('weight'))?.processedData;
    const temperatureData = realTimeData?.find((data: any) => data.topic?.includes('temperature'))?.processedData;
    const airData = realTimeData?.find((data: any) => data.topic?.includes('air'))?.processedData;

    // Procesar datos de IMU para simular encoder
    const processedEncoderData = imuData ? {
      value: {
        angle: Math.atan2(imuData.value.accel_y, imuData.value.accel_x) * (180 / Math.PI),
        position: Math.abs(imuData.value.accel_z) / 2, // Normalizar a 0-1
        speed: Math.sqrt(imuData.value.gyro_x**2 + imuData.value.gyro_y**2 + imuData.value.gyro_z**2) * 10
      }
    } : {
      value: { 
        angle: 45, 
        position: 0.6,
        speed: 120 
      }
    };

    return {
      encoderData: encoderData || processedEncoderData,
      milkQuantityData: milkData || { value: 75.5 },
      switchStatus: switchData || { value: true },
      weightData: weightData || { value: 1250.8 },
      tankTemperaturesData: temperatureData || { value: 4.2 },
      airQualityData: airData || {
        value: { 
          humidity: 65, 
          temperature: 22.5 
        }
      }
    };
  };

  const modelData = processRealTimeDataForModel();

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

  // Simular reproducción de datos históricos
  useEffect(() => {
    if (isPlaying && mode === 'historical') {
      const interval = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          const next = prev + 1;
          if (next >= tankStates.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, mode, tankStates.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Cargar datos históricos cuando cambian los filtros
  useEffect(() => {
    if (selectedDate && session?.accessToken && mode === 'historical') {
      handleLoadHistoricalData();
    }
  }, [selectedDate, boardIds, session?.accessToken, mode, handleLoadHistoricalData]);

  return (
    <PageContainer>
      <div className="w-full mt-10 sm:mb-0 mb-20 max-h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Barra de control superior */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 z-10">
    
            {/* Toggle de modo */}
            <div className="md:col-span-4">
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

          </div>

          {/* Barra horizontal de eventos - Solo visible en modo histórico */}
          {mode === 'historical' && (
            <div className="px-4 py-3 bg-card border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground">Timeline de Eventos</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlay}
                    disabled={!isPlaying && currentTimeIndex >= tankStates.length - 1}
                    className="bg-background border-border text-foreground"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTimeIndex(Math.max(0, currentTimeIndex - 1))}
                    disabled={currentTimeIndex === 0}
                    className="bg-background border-border text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTimeIndex(Math.min(tankStates.length - 1, currentTimeIndex + 1))}
                    disabled={currentTimeIndex === tankStates.length - 1}
                    className="bg-background border-border text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Timeline horizontal */}
              <div className="relative">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {tankStates.map((state, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center p-2 rounded-lg border min-w-[120px] transition-all cursor-pointer",
                        currentTimeIndex === index 
                          ? "bg-primary/10 border-primary shadow-md" 
                          : "bg-background border-border hover:bg-accent/50"
                      )}
                      onClick={() => setCurrentTimeIndex(index)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          currentTimeIndex === index ? "bg-primary" : state.color
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          currentTimeIndex === index 
                            ? "text-foreground" 
                            : getStateTextColor(state.state)
                        )}>
                          {state.state}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        <div>{state.start}</div>
                        <div>{state.end}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Indicador de progreso */}
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentTimeIndex + 1) / tankStates.length) * 100}%` }}
                  />
                </div>
              </div>
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
                  {historicalLoading ? (
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
                  encoderData={modelData.encoderData}
                  milkQuantityData={modelData.milkQuantityData}
                  switchStatus={modelData.switchStatus}
                  weightData={modelData.weightData}
                  tankTemperaturesData={modelData.tankTemperaturesData}
                  airQualityData={modelData.airQualityData}
                  selectedData={selectedData}
                />
              </div>
            </div>
            
            {/* Panel de filtros históricos (derecha) - Solo visible en modo histórico */}
            {mode === 'historical' && isFiltersVisible && (
              <div className="w-80 h-full flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="sticky top-0 z-10 bg-card border-b border-border p-3">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold truncate text-foreground">Filtros Históricos</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFiltersVisible(false)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Ocultar filtros"
                    >
                      <CircleX className="h-3 w-3" />
                      <span className="sr-only">Ocultar Filtros</span>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-4">
                    {/* Rango de fechas */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Rango de Fechas</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal text-xs bg-background border-border text-foreground",
                                !dateRange?.from && "text-muted-foreground"
                              )}
                            >
                              {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : "Desde"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-background border-border">
                            <Calendar
                              mode="single"
                              selected={dateRange?.from}
                              onSelect={(date) => setDateRange({ from: date, to: dateRange?.to })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal text-xs bg-background border-border text-foreground",
                                !dateRange?.to && "text-muted-foreground"
                              )}
                            >
                              {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "Hasta"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-background border-border">
                            <Calendar
                              mode="single"
                              selected={dateRange?.to}
                              onSelect={(date) => setDateRange({ from: dateRange?.from, to: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Estado del tanque */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Estado del Tanque</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full text-xs bg-background border-border text-foreground">
                          <SelectValue placeholder="Seleccionar estado" />
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


                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange(null);
                          setSelectedStatus('all');
                          setSelectedSensor('all');
                        }}
                        className="flex-1 text-xs bg-background border-border text-foreground"
                      >
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Verificar que hay fechas seleccionadas
                          if (dateRange?.from && dateRange?.to) {
                            console.log('Aplicar filtros:', { dateRange, selectedStatus, selectedSensor });
                            // Aquí se cargarían los datos históricos
                            // Por ahora solo mostramos un mensaje de confirmación
                            alert('Filtros aplicados correctamente. Los datos históricos se cargarán automáticamente.');
                          } else {
                            alert('Por favor selecciona un rango de fechas completo (desde y hasta)');
                          }
                        }}
                        className="flex-1 text-xs"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón para mostrar filtros cuando están ocultos */}
            {mode === 'historical' && !isFiltersVisible && (
              <div className="w-12 h-full flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="flex-1 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFiltersVisible(true)}
                    className="h-auto py-2 px-1 rounded-none shadow-sm flex flex-col gap-1 hover:bg-accent transition-all" 
                    title="Mostrar filtros históricos"
                  >
                    <Sliders className="h-4 w-4 text-foreground" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 