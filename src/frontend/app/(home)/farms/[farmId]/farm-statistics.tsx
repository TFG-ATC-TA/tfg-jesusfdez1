'use client'

import { useState, useRef } from 'react';
import TemperatureGyrocopeChart from '@/components/charts/temperature-gyroscope-chart';
import { CalendarDateRangePicker, DateRange, CalendarDateRangePickerRef } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import DairyTimeline from "@/components/charts/dairy-timeline-chart";
import AirQualityChart from "@/components/charts/air-quality-chart";
import AccelerometerChart from "@/components/charts/accelerometer-chart";
import { Farm } from '@/types';

export default function Statistics({ farmData }: { farmData: Farm }) {
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

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    // Aplicar el nuevo rango de fechas cuando se reciba desde el picker
    setAppliedDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    // Usar la referencia para aplicar los cambios desde el CalendarDateRangePicker
    if (dateRangePickerRef.current) {
      dateRangePickerRef.current.applyChanges();
    }
  };

  return (
    <div className="space-y-8">
      {/* Sección de Datos Históricos */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-semibold">Datos históricos</h3>
          </div>
          {/* Selector de fechas */}
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
          <p className="text-sm text-muted-foreground pl-4 mb-7">Análisis de tendencias basado en el rango de fechas seleccionado</p>
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

      {/* Separador visual con mayor espacio */}
      <div className="py-4">
        <div className="border-t border-border"></div>
      </div>

      {/* Sección de Datos en Tiempo Real */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-green-600 rounded-full"></div>
          <h3 className="text-xl font-semibold">Datos en tiempo real</h3>
        </div>
        <div>
          <p className="text-sm text-muted-foreground pl-4 mb-7">Monitorización en vivo de sensores activos</p>
          <div className="grid grid-cols-1 gap-4 pt-0">
            <AirQualityChart bucket={farmData.idname} />
            <AccelerometerChart bucket={farmData.idname} />
          </div>
        </div>
      </div>
    </div>
  );
}
