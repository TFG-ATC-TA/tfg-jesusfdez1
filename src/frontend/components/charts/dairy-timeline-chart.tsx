"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createPortal } from 'react-dom'
import { Activity, Repeat, Milk, Droplet, RefreshCw, Thermometer, Clock } from 'lucide-react'

function getRandomTime() {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getRandomTimeRange() {
  const startHour = Math.floor(Math.random() * 24);
  const startMinute = Math.floor(Math.random() * 60);
  const duration = 30 + Math.floor(Math.random() * (180 - 30 + 1)); 
  let endHour = startHour;
  let endMinute = startMinute + duration;
  if (endMinute >= 60) {
    endHour += Math.floor(endMinute / 60);
    endMinute %= 60;
  }
  if (endHour > 23) {
    endHour = 23;
    endMinute = 59;
  }
  const format = (v: number) => String(v).padStart(2, '0');
  return {
    start: `${format(startHour)}:${format(startMinute)}`,
    end: `${format(endHour)}:${format(endMinute)}`,
  };
}

const timelineData = [
  {
    id: "ordeño",
    name: "Ordeños",
    schedule: Array.from({ length: 10 }, (_, i) => {
      const slot1 = getRandomTimeRange();
      const slot2 = getRandomTimeRange();
      return [
        { start: slot1.start, end: slot1.end, day: i + 1 },
        { start: slot2.start, end: slot2.end, day: i + 1 },
      ];
    }).flat(),
    color: "bg-blue-500 dark:bg-blue-400",
  },
  {
    id: "agitacion",
    name: "Agitaciones",
    schedule: Array.from({ length: 10 }, (_, i) => {
      const slot1 = getRandomTimeRange();
      const slot2 = getRandomTimeRange();
      return [
        { start: slot1.start, end: slot1.end, day: i + 1 },
        { start: slot2.start, end: slot2.end, day: i + 1 },
      ];
    }).flat(),
    color: "bg-orange-500 dark:bg-orange-400",
  },
  {
    id: "vaciado",
    name: "Vaciados",
    schedule: Array.from({ length: 10 }, (_, i) => {
      const slot = getRandomTimeRange();
      return [
        { start: slot.start, end: slot.end, day: i + 1 },
      ];
    }).flat(),
    color: "bg-green-500 dark:bg-green-400",
  },
  {
    id: "lavado",
    name: "Lavados",
    schedule: Array.from({ length: 10 }, (_, i) => {
      const slot = getRandomTimeRange();
      return [
        { start: slot.start, end: slot.end, day: i + 1 },
      ];
    }).flat(),
    color: "bg-purple-500 dark:bg-purple-400",
  },
]

const hours = Array.from({ length: 24 }, (_, i) => 
  `${String(i).padStart(2, '0')}:00`
)

const days = Array.from({ length: 10 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return date.toLocaleDateString();
});
const DAYS_PER_PAGE = 4

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

const numCycles = 10
const avgDurationCycles = "30 min"
const numMilkings = 5
const avgDurationMilkings = "20 min"
const numAgitations = 8
const numEmptyings = 3
const numWashings = 4
const coolingRate = "15°C/h"

export default function DairyTimeline() {
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.ceil(days.length / DAYS_PER_PAGE)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  
  const visibleDays = days.slice(
    currentPage * DAYS_PER_PAGE,
    (currentPage + 1) * DAYS_PER_PAGE
  )

  const PageSelector = () => {
    const currentPageNumber = currentPage + 1

    return (
      <div className="flex items-center space-x-2">
        <span>Página</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-[70px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
            <span>{currentPageNumber}</span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[70px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, i) => (
              <DropdownMenuItem key={i} onSelect={() => setCurrentPage(i)}>
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
      <CardContent className="pt-2"> 
        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          <Card className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>ciclos</div>
              </CardTitle>
              <Repeat className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold flex items-center">
                <span className="text-xl font-bold">{numCycles}</span>
                <span className="ml-1">
                  (<Clock className="inline h-4 w-4 mx-0.5" />
                  {avgDurationCycles})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${timelineData[0].color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>ordeños</div>
              </CardTitle>
              <Milk className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold flex items-center">
                <span className="text-xl font-bold">{numMilkings}</span>
                <span className="ml-1">
                  (<Clock className="inline h-4 w-4 mx-0.5" />
                  {avgDurationMilkings})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${timelineData[1].color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>agitaciones</div>
              </CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{numAgitations}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${timelineData[2].color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>vaciados</div>
              </CardTitle>
              <Droplet className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{numEmptyings}</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${timelineData[3].color} bg-opacity-20 dark:bg-opacity-20 text-black dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Número de</div>
                <div>lavados</div>
              </CardTitle>
              <RefreshCw className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{numWashings}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 h-24 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-2 flex-none">
              <CardTitle className="text-base font-bold leading-tight">
                <div>Velocidad de</div>
                <div>enfriamiento</div>
              </CardTitle>
              <Thermometer className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 flex-1 flex items-end">
              <div className="text-base font-semibold">
                <span className="text-xl font-bold">{coolingRate}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline table */}
        <div className="relative border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden h-[402px]">
          {/* Container con overflow-x-auto */}
          <div className="overflow-x-auto">
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
            <div className="flex h-[321px]"> {/* Ajustado de 400px a 320px (80px * 4 días) */}
              {/* Days column */}
              <div className="w-32 border-r dark:border-gray-700 bg-muted/30 dark:bg-gray-800/30 flex-none"> {/* Añadido flex-none */}
                {visibleDays.map((day, i) => (
                  <div
                    key={day}
                  className="h-[80px] flex items-center justify-center border-b last:border-b-0 flex-none"> {/* Cambiado de 100px a 80px */}
                    <span className="text-sm font-medium">{day}</span>
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
                {visibleDays.map((_, dayIndex) => {
                  const actualDayIndex = currentPage * DAYS_PER_PAGE + dayIndex + 1;
                  return (
                    <div key={dayIndex} className="relative h-[80px] border-b dark:border-gray-700 last:border-b-0 z-[2]">
                      {timelineData.map((activity) => {
                        const daySchedule = activity.schedule.filter(slot => slot.day === actualDayIndex)
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
                                  x: rect.left, // Ya no sumamos la mitad del ancho
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
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
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

