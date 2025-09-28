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
import { processRealTimeDataForModel, processHistoricalDataForModel, getUnifiedData } from '@/utils/data-processing';
import { getStateColor, getStateTextColor, createHandleCardSelect, SENSORS_CONFIG, createHandleLoadHistoricalData } from '@/utils/tank-utils';
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

  // Hook para estados del tanque - SOLO en modo histórico
  const {
    tankStates,
    tankStatesLoading,
    tankStatesError,
    fetchTankStates,
    retryFetchTankStates,
  } = useTankStates({
    filters: mode === 'historical' ? {
      selectedDate: filters.selectedDate || undefined,
      dateRange: dateRange && dateRange.from && dateRange.to ? {
        from: dateRange.from,
        to: dateRange.to
      } : null
    } : {
      selectedDate: undefined,
      dateRange: null
    }, // No cargar estados en modo tiempo real
    boardIds: mode === 'historical' ? boardIds : [], // No usar boardIds en modo tiempo real
    selectedFarm: mode === 'historical' ? selectedFarm : '', // No usar selectedFarm en modo tiempo real
    selectedTank: mode === 'historical' ? (selectedTank?.name || 'default-tank') : '', // No usar selectedTank en modo tiempo real
    mode, // Pasar el modo al hook
  });


  // Crear manejador de carga de datos históricos usando utilidad compartida
  const handleLoadHistoricalData = createHandleLoadHistoricalData(
    selectedFarm,
    filters,
    null, // No hay appliedDateRange en digital-twin
    selectedDate,
    fetchHistoricalData,
    session
  );

  const modelData = processRealTimeDataForModel(realTimeData || []);



  // Datos unificados - comportamiento separado por modo
  const unifiedData = useMemo(() => {
    if (mode === "realtime") {
      // MODO TIEMPO REAL: Solo usar datos de WebSocket
      return processRealTimeDataForModel(realTimeData || []);
    } else {
      // MODO HISTÓRICO: Solo usar datos históricos de la API
      return getUnifiedData(
        mode,
        [], // No pasar datos de tiempo real en modo histórico
        historicalData,
        selectedHistoricalData,
        selectedTime,
        selectedDate
      );
    }
  }, [mode, selectedTime, selectedDate, historicalData, selectedHistoricalData, realTimeData]);

  // Usar configuración de sensores compartida
  const sensors = SENSORS_CONFIG;
  
  // Crear manejador de selección de tarjetas usando utilidad compartida
  const handleCardSelect = createHandleCardSelect(setSelectedData, selectedData);

  // Ya no necesario - se maneja en el efecto anterior

  // SOLO cargar datos históricos en modo histórico
  useEffect(() => {
    if (mode === 'historical' && filters.selectedDate && selectedFarm && session?.accessToken) {
      setSelectedDate(filters.selectedDate);
      
      const newDate = filters.selectedDate.toISOString().split('T')[0];
      const params: HistoricalDataParams = {
        farm: selectedFarm,
        date: newDate,
        boardIds: boardIds,
        tank: { height: 100 }
      };
      
      // Solo cargar datos históricos en modo histórico
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
                  filters={mode === 'historical' ? { dateRange } : undefined}
                  selectedHistoricalData={mode === 'historical' ? selectedHistoricalData : undefined}
                  historicalData={mode === 'historical' ? historicalData : undefined}
                  tankStates={mode === 'historical' ? tankStates : undefined}
                  tankStatesLoading={mode === 'historical' ? tankStatesLoading : false}
                  error={mode === 'historical' ? error : undefined}
                  handleTimeSelected={mode === 'historical' ? handleTimeSelected : undefined}
                  fetchHistoricalData={mode === 'historical' ? handleLoadHistoricalData : undefined}
                  selectedTime={mode === 'historical' ? selectedTime : undefined}
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