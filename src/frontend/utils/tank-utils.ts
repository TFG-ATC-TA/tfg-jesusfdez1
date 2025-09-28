/**
 * Utilidades compartidas para componentes de tanques
 * Contiene funciones reutilizables para manejo de estados y datos
 */

import { format } from 'date-fns';
import { Droplets, Thermometer, Zap, Gauge, Activity, Weight, Database } from 'lucide-react';

/**
 * Función para obtener el color del estado del tanque
 */
export const getStateColor = (state: string) => {
  switch (state) {
    case 'MILKING': return 'bg-green-500';
    case 'COOLING': return 'bg-blue-500';
    case 'CLEANING': return 'bg-yellow-500';
    case 'EMPTY TANK': return 'bg-red-500';
    case 'MAINTENANCE': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

/**
 * Función para obtener el color de texto del estado del tanque
 */
export const getStateTextColor = (state: string) => {
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
 * Función para manejar la selección de tarjetas de sensores
 */
export const createHandleCardSelect = (setSelectedData: (data: string | null) => void, selectedData: string | null) => {
  return (cardName: string) => {
    setSelectedData(cardName === selectedData ? null : cardName);
  };
};

/**
 * Configuración de sensores disponibles
 */
export const SENSORS_CONFIG = [
  { name: "MilkQuantity", icon: Droplets, label: "Cantidad de Leche" },
  { name: "TankTemperatures", icon: Thermometer, label: "Temperatura del Tanque" },
  { name: "MagneticSwitch", icon: Zap, label: "Interruptor Magnético" },
  { name: "Encoder", icon: Gauge, label: "Encoder" },
  { name: "Gyroscope", icon: Activity, label: "Giroscopio" },
  { name: "Weight", icon: Weight, label: "Peso" },
  { name: "AirQuality", icon: Database, label: "Calidad del Aire" },
];

/**
 * Función para crear el manejador de carga de datos históricos
 */
export const createHandleLoadHistoricalData = (
  selectedFarm: string,
  filters: any,
  appliedDateRange: any,
  selectedDate: Date | undefined,
  fetchHistoricalData: any,
  session: any
) => {
  return async () => {
    // Usar la fecha del slider si está disponible, sino usar la fecha del rango aplicado
    const dateToUse = filters.selectedDate || appliedDateRange?.from || selectedDate;
    
    if (!selectedFarm || !dateToUse) {
      console.error('Missing required parameters:', { selectedFarm, dateToUse, appliedDateRange, selectedDate });
      return;
    }

    if (!session?.accessToken) {
      console.error('No session token available');
      return;
    }

    
    const params = {
      farm: selectedFarm,
      date: format(dateToUse, 'yyyy-MM-dd'), // Usar date-fns para evitar problemas de zona horaria
      boardIds: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    };

    try {
      await fetchHistoricalData(params, session?.accessToken);
    } catch (error: unknown) {
      // Error handling is done by the calling component
    }
  };
};
