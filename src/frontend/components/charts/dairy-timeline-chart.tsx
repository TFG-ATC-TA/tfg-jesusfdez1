"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createPortal } from 'react-dom'
import { Activity, Repeat, Milk, Droplet, RefreshCw, Thermometer, Clock, AlertTriangle } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"

const hours = Array.from({ length: 24 }, (_, i) => 
  `${String(i).padStart(2, '0')}:00`
)

const DAYS_PER_PAGE = 4

interface ActivityData {
  id: string;
  schedule: Array<{
    start: string;
    end: string;
    day: number;
    date?: string;
  }>;
}

interface SummaryData {
  numCycles: number;
  avgDurationCycles: string;
  numMilkings: number;
  avgDurationMilkings: string;
  numAgitations: number;
  numEmptyings: number;
  numWashings: number;
  coolingRate: string;
}

interface ApiResponse {
  success: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    daysPerPage: number;
    totalDays: number;
    visibleDates: string[];
  };
  summary: SummaryData;
  timeline: ActivityData[];
}

// Configuración de actividades con traducción y colores
const ACTIVITY_CONFIG = {
  milking: {
    name: "Ordeños",
    color: "bg-blue-500 dark:bg-blue-400"
  },
  maintenance: {
    name: "Agitaciones", 
    color: "bg-orange-500 dark:bg-orange-400"
  },
  emptying: {
    name: "Vaciados",
    color: "bg-green-500 dark:bg-green-400"
  },
  cleaning: {
    name: "Lavados",
    color: "bg-purple-500 dark:bg-purple-400"
  }
} as const;

interface TooltipProps {
  text: string;
  isVisible: boolean;
  x: number;
  y: number;
}

function Tooltip({ text, isVisible, x, y }: TooltipProps) {
  if (!isVisible) return null;
  
  return createPortal(
    <div 
      className="fixed bg-black/75 text-white text-xs p-1 rounded whitespace-nowrap pointer-events-none"
      style={{ 
        left: x,
        top: y - 8, // Añadimos un pequeño offset vertical
        transform: 'translateY(-100%)', // Solo transformamos en Y
        zIndex: 99999
      }}
    >
      {text}
    </div>,
    document.body
  );
}

interface DairyTimelineProps {
  bucket: string;
  startDate?: Date;
  endDate?: Date;
}

export default function DairyTimeline({ bucket, startDate, endDate }: DairyTimelineProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [pendingPage, setPendingPage] = useState<number | null>(null) // Para manejar transiciones suaves
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [rawTimelineData, setRawTimelineData] = useState<ActivityData[]>([]);
  const [paginationData, setPaginationData] = useState({
    currentPage: 0,
    totalPages: 1,
    daysPerPage: DAYS_PER_PAGE,
    totalDays: 0,
    visibleDates: [] as string[]
  });
  const [summaryData, setSummaryData] = useState<SummaryData>({
    numCycles: 0,
    avgDurationCycles: "0 min",
    numMilkings: 0,
    avgDurationMilkings: "0 min",
    numAgitations: 0,
    numEmptyings: 0,
    numWashings: 0,
    coolingRate: "15°C/h"
  });
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false); // Estado para carga de páginas
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false); // Controla cuándo mostrar el overlay
  const [error, setError] = useState<string | null>(null);

  // Procesar datos del timeline con configuración local
  const timelineData = rawTimelineData.map(activity => ({
    ...activity,
    name: ACTIVITY_CONFIG[activity.id as keyof typeof ACTIVITY_CONFIG]?.name || activity.id,
    color: ACTIVITY_CONFIG[activity.id as keyof typeof ACTIVITY_CONFIG]?.color || "bg-gray-500"
  }));

  // Usar datos de paginación del backend
  const totalPages = paginationData.totalPages;
  const visibleDates = paginationData.visibleDates;

  // Función para cargar datos de una página específica
  const fetchPageData = async (page: number, isInitialLoad = false) => {
    let loadingTimer: NodeJS.Timeout | null = null;
    try {
      if (!isInitialLoad) {
        setPageLoading(true);
        setPendingPage(page);
        // Mostrar overlay solo después de 1 segundo
        loadingTimer = setTimeout(() => {
          setShowLoadingOverlay(true);
        }, 1000);
      } else {
        setLoading(true);
      }
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/postgres/farm-activities`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('daysPerPage', DAYS_PER_PAGE.toString());
      url.searchParams.append('bucket', bucket);
      if (startDate) url.searchParams.append('startDate', startDate.toISOString());
      if (endDate) url.searchParams.append('endDate', endDate.toISOString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setSummaryData(data.summary);
        setRawTimelineData(data.timeline);
        setPaginationData(data.pagination);
        setCurrentPage(page);
        setPendingPage(null);
      } else {
        throw new Error('Error en la respuesta de la API');
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setPendingPage(null);
    } finally {
      // Limpiar el timer si existe
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setPageLoading(false);
        setShowLoadingOverlay(false);
      }
    }
  };

  // Cargar datos iniciales y cuando cambian las props
  useEffect(() => {
    fetchPageData(0, true);
  }, [bucket, startDate, endDate]);

  const PageSelector = () => {
    const currentPageNumber = currentPage + 1
    const displayPageNumber = pendingPage !== null ? pendingPage + 1 : currentPageNumber

    return (
      <div className="flex items-center space-x-2">
        <span>Página</span>
        <DropdownMenu>
          <DropdownMenuTrigger 
            className={`w-[70px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm ${pageLoading ? 'opacity-60' : ''}`}
            disabled={pageLoading || pendingPage !== null}
          >
            <span className={pageLoading ? 'animate-pulse' : ''}>{displayPageNumber}</span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[70px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, i) => (
              <DropdownMenuItem key={i} onSelect={() => fetchPageData(i)} disabled={pageLoading || pendingPage !== null}>
                {i + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span>de {totalPages}</span>
      </div>
    )
  }

  const getPositionStyle = (start: string, end: string) => {
    const startHour = parseInt(start.split(":")[0])
    const startMinute = parseInt(start.split(":")[1])
    const endHour = parseInt(end.split(":")[0])
    const endMinute = parseInt(end.split(":")[1])
    
    const startPercent = (startHour + startMinute / 60) * (100 / 24)
    const endPercent = (endHour + endMinute / 60) * (100 / 24)
    const width = endPercent - startPercent
    
    // Calculamos el z-index inverso basado en la hora de inicio
    // Las actividades más tempranas tendrán mayor z-index
    const zIndex = 1000 - (startHour * 60 + startMinute)
    
    return {
      left: `${startPercent}%`,
      width: `${width}%`,
      zIndex: zIndex,
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Actividades de la granja</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-5 w-5" />
                </CardHeader>
                <CardContent className="p-2 flex-1 flex items-end">
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-[402px] w-full" />
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span>Página</span>
              <Skeleton className="h-10 w-[70px]" />
              <span>de 1</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Actividades de la granja</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-2">
          <div className="mb-4 max-w-[calc(100%-2rem)] px-4 py-3 rounded-md bg-destructive dark:bg-red-900 border border-destructive dark:border-red-800 text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 inline-block flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">No hay datos disponibles en este momento. Por favor, vuelva a intentarlo más tarde.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-0 pb-4"> {/* Cambiado pb-2 a pb-4 para un poco más de espacio */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-2xl font-bold">Actividades de la granja</CardTitle>
          <div className="flex flex-wrap gap-2">
            {timelineData.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-sm ${item.color}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-2"> 
        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          <Card 
            className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Ciclos completos de ordeño y enfriamiento. Duración promedio: ${summaryData.avgDurationCycles}`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>ciclos</div>
              </CardTitle>
              <Repeat className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold flex items-center">
                <span className="text-xl font-bold">{summaryData.numCycles}</span>
                <span className="ml-1">
                  (<Clock className="inline h-4 w-4 mx-0.5" />
                  {summaryData.avgDurationCycles})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`${ACTIVITY_CONFIG.milking.color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Total de sesiones de ordeño. Duración promedio: ${summaryData.avgDurationMilkings}`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>ordeños</div>
              </CardTitle>
              <Milk className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold flex items-center">
                <span className="text-xl font-bold">{summaryData.numMilkings}</span>
                <span className="ml-1">
                  (<Clock className="inline h-4 w-4 mx-0.5" />
                  {summaryData.avgDurationMilkings})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`${ACTIVITY_CONFIG.maintenance.color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Número total de agitaciones para mantener la leche en movimiento`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>agitaciones</div>
              </CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{summaryData.numAgitations}</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`${ACTIVITY_CONFIG.emptying.color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Número total de vaciados del tanque para recolección de leche`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>vaciados</div>
              </CardTitle>
              <Droplet className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{summaryData.numEmptyings}</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`${ACTIVITY_CONFIG.cleaning.color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Número total de ciclos de lavado y desinfección del tanque`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>lavados</div>
              </CardTitle>
              <RefreshCw className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{summaryData.numWashings}</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col cursor-help"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                show: true,
                text: `Velocidad promedio de enfriamiento de la leche después del ordeño`,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Velocidad de</div>
                <div>enfriamiento</div>
              </CardTitle>
              <Thermometer className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{summaryData.coolingRate}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline table */}
        <div className="relative border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden h-[402px]">
          {/* Overlay de carga para transiciones suaves */}
          {showLoadingOverlay && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cargando página {pendingPage !== null ? pendingPage + 1 : '...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Container con overflow-x-auto */}
          <div className={`overflow-x-auto ${pageLoading ? 'pointer-events-none' : ''}`}>
            {/* Hours header */}
            <div className="flex border-b dark:border-gray-700 h-20 bg-muted/50 dark:bg-gray-800/50 sticky top-0 z-10">
              <div className="w-32 flex-none border-r dark:border-gray-700 bg-muted dark:bg-gray-800 flex items-center justify-center">
                <span className="text-sm font-medium">Hora / Día</span>
              </div>
              {/* Grid de horas con ancho mínimo */}
              <div className="flex-1 relative" style={{ minWidth: '1000px' }}>
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-l flex items-center justify-center"
                    style={{ left: `${(i * 100) / 24}%`, width: `${100 / 24}%` }}
                  >
                    <span className="text-xs font-medium transform -rotate-90 whitespace-nowrap">
                      {hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline content */}
            <div className={`flex h-[321px] transition-opacity duration-300 ${pageLoading ? 'opacity-60' : 'opacity-100'}`}> {/* Ajustado de 400px a 320px (80px * 4 días) */}
              {/* Days column */}
              <div className="w-32 border-r dark:border-gray-700 bg-muted/30 dark:bg-gray-800/30 flex-none"> {/* Añadido flex-none */}
                {visibleDates.map((date, i) => (
                  <div
                    key={date}
                  className="h-[80px] flex items-center justify-center border-b last:border-b-0 flex-none"> {/* Cambiado de 100px a 80px */}
                    <span className="text-sm font-medium">{new Date(date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>

              {/* Timeline grid con el mismo ancho mínimo */}
              <div className="flex-1 relative" style={{ minWidth: '1000px' }}>
                {/* Background */}
                <div className="absolute inset-0 bg-white dark:bg-gray-900" />
                
                {/* Grid lines */}
                {hours.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700 z-[1]"
                    style={{ left: `${(i * 100) / 24}%` }}
                  />
                ))}

                {/* Day rows */}
                {visibleDates.map((date, dayIndex) => {
                  return (
                    <div key={dayIndex} className="relative h-[80px] border-b dark:border-gray-700 last:border-b-0 z-[2]">                  {timelineData.map((activity) => {
                    const daySchedule = activity.schedule.filter(slot => slot.date === date)
                    return daySchedule.map((slot, slotIndex) => (
                      <div 
                        key={`${activity.id}-${dayIndex}-${slotIndex}`} 
                        className="absolute left-0 right-0 h-[20px]"
                        style={{ top: `${timelineData.findIndex(a => a.id === activity.id) * 20}px` }}
                      >
                        <div
                          className={`absolute h-full ${activity.color} opacity-90 shadow-sm 
                                    transition-all hover:opacity-100 hover:scale-y-105 cursor-help rounded-sm`}
                          style={getPositionStyle(slot.start, slot.end)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              show: true,
                              text: `${activity.name}: ${slot.start} - ${slot.end}`,
                              x: rect.left,
                              y: rect.top
                            });
                          }}
                          onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
                        />
                      </div>
                    ))
                  })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Nueva sección de paginación */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between mt-4">
          <PageSelector />
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => fetchPageData(0)}
              disabled={currentPage === 0 || pageLoading || pendingPage !== null}
              title="Primera página"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: "Primera página",
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => fetchPageData(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0 || pageLoading || pendingPage !== null}
              title="Página anterior"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: "Página anterior",
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => fetchPageData(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1 || pageLoading || pendingPage !== null}
              title="Página siguiente"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: "Página siguiente",
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => fetchPageData(totalPages - 1)}
              disabled={currentPage === totalPages - 1 || pageLoading || pendingPage !== null}
              title="Última página"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  text: "Última página",
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, text: '', x: 0, y: 0 })}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <Tooltip 
        text={tooltip.text}
        isVisible={tooltip.show}
        x={tooltip.x}
        y={tooltip.y}
      />
    </Card>
  )
}

