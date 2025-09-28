'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
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
import { processRealTimeDataForModel, processHistoricalDataForModel, getUnifiedData } from '@/utils/data-processing';
import { createHandleCardSelect, SENSORS_CONFIG, createHandleLoadHistoricalData } from '@/utils/tank-utils';
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
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [boardIds] = useState<string[]>(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  const [selectedBoard] = useState<string>('6_dof_imu');
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [isSensorsTabVisible, setIsSensorsTabVisible] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSensor, setSelectedSensor] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('charts'); // Estado para controlar pestaña activa

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

  // Hook para estados del tanque - SOLO en pestaña histórico
  const {
    tankStates,
    tankStatesLoading,
    tankStatesError,
    fetchTankStates,
    retryFetchTankStates,
  } = useTankStates({
    filters: activeTab === 'digital-twin' ? {
      selectedDate: filters.selectedDate || undefined,
      dateRange: appliedDateRange && appliedDateRange.from && appliedDateRange.to ? {
        from: appliedDateRange.from,
        to: appliedDateRange.to
      } : null
    } : {
      selectedDate: undefined,
      dateRange: null
    },
    boardIds: activeTab === 'digital-twin' ? boardIds : [],
    selectedFarm: activeTab === 'digital-twin' ? selectedFarm : '',
    selectedTank: activeTab === 'digital-twin' ? (selectedTank?.name || 'default-tank') : '',
    mode: 'historical',
  });

  // Effect to load historical data when applied date range changes - SOLO en pestaña histórico
  useEffect(() => {
    // Solo ejecutar en la pestaña de histórico
    if (activeTab !== 'digital-twin') {
      return;
    }

    if (appliedDateRange?.from && appliedDateRange?.to && session?.accessToken) {
      handleLoadHistoricalData();
      setSelectedTime(null); // Resetea el tiempo seleccionado
    }
  }, [activeTab, appliedDateRange?.from, appliedDateRange?.to, filters.selectedDate, session?.accessToken]);

  // 2. Cuando llegan nuevos datos históricos, selecciona el primer timestamp - SOLO en pestaña histórico
  useEffect(() => {
    // Solo ejecutar en la pestaña de histórico
    if (activeTab !== 'digital-twin') {
      return;
    }

    if (historicalData && Object.keys(historicalData).length > 0) {
      const timeKeys = Object.keys(historicalData);
      
      // Select the first available timestamp
      const firstTime = timeKeys[0];
      
      setSelectedTime(firstTime);
      if (typeof handleTimeSelected === 'function') {
        handleTimeSelected(firstTime);
      }
    }
  }, [activeTab, historicalData, handleTimeSelected]);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    setAppliedDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    if (dateRangePickerRef.current) {
      dateRangePickerRef.current.applyChanges();
    }
  };

  // Crear manejador de carga de datos históricos usando utilidad compartida
  const handleLoadHistoricalData = createHandleLoadHistoricalData(
    selectedFarm,
    filters,
    appliedDateRange,
    undefined, // No hay selectedDate en farm-statistics
    fetchHistoricalData,
    session
  );

  const modelData = processRealTimeDataForModel(realTimeData || []);


  // Datos unificados - comportamiento separado por modo
  const unifiedData = useMemo(() => {
    // En farm-statistics, el modo se determina por la pestaña activa
    // Pestaña "charts" = tiempo real, pestaña "digital-twin" = histórico
    return getUnifiedData(
      "historical", // Siempre histórico en farm-statistics
      [], // No usar datos de tiempo real en farm-statistics
      historicalData,
      selectedHistoricalData,
      selectedTime,
      selectedDate
    );
  }, [historicalData, selectedHistoricalData, selectedTime, selectedDate]);

  const handleTimeSelectionChange = (timeString: string) => {
    setSelectedTime(timeString);
    // Update selectedHistoricalData when time changes
    if (timeString && handleTimeSelected) {
      handleTimeSelected(timeString);
    }
  };

  // Crear manejador de selección de tarjetas usando utilidad compartida
  const handleCardSelect = createHandleCardSelect(setSelectedData, selectedData);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="charts" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
                            {SENSORS_CONFIG.map((sensor) => (
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
                      selectedHistoricalData={undefined} // No usar datos históricos en tiempo real
                      historicalData={undefined} // No usar datos históricos en tiempo real
                      error={error}
                      handleTimeSelected={handleTimeSelectionChange}
                      fetchHistoricalData={undefined} // No hacer peticiones históricas en tiempo real
                      selectedTime={undefined} // No usar tiempo seleccionado en tiempo real
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
                            {SENSORS_CONFIG.map((sensor) => (
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
                      fetchHistoricalData={handleLoadHistoricalData} // Siempre histórico en farm-statistics
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
                        <div className="space-y-2">
                          <TimeSeriesSlider
                            startDate={appliedDateRange.from!}
                            endDate={appliedDateRange.to!}
                            onTimeSelected={handleTimeSelectionChange}
                            showPlayButton={false}
                            showTimeSlider={false}
                          />
                          <div className="flex items-center justify-center h-[50px]">
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
                        <div className="h-[10px]">
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
