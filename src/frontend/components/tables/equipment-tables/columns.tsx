/**
 * Configuración de columnas para la tabla de equipamiento
 * Define las columnas visibles, formato de datos y acciones disponibles
 * Incluye mapeo de colores para tipos de equipamiento y configuración de acciones
 */

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Equipment } from '@/types';
import { Badge } from '@/components/ui/badge';

/**
 * Mapeo de colores para tipos de equipamiento
 * Define colores específicos para cada tipo de equipo
 */
const equipmentTypeColors: Record<string, string> = {
  "Tanque de leche": "#0284c7", // sky-600
  "Estación de lavado": "#059669", // emerald-600
};

/**
 * Genera columnas dinámicas con función de actualización
 * Permite actualizar la tabla después de cambios
 * @param onRefresh - Función para actualizar la tabla
 * @returns Array de definiciones de columnas
 */
export const getColumns = (onRefresh: () => void): ColumnDef<Equipment>[] => [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Tipo',
    accessorKey: 'type',
    accessorFn: (row) => row.type, // Para filtrado
    id: 'type', // Usar "type" en lugar de "equipmentType"
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = equipmentTypeColors[value] || "#6b7280"; // Default to gray-500
      return (
        <Badge 
          className="max-w-[220px] h-6 flex items-center justify-center text-xs truncate px-2" 
          style={{ backgroundColor, color: 'white' }}
        >
          {value}
        </Badge>
      );
    },
  },
  {
    header: 'Dispositivos',
    accessorKey: 'deviceCount',
    cell: ({ row }) => {
      const count = row.original.deviceCount || 0;
      return <span>{count}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={onRefresh} />
  }
];

/**
 * Columnas estáticas para casos donde no se necesite actualización
 * Versión simplificada sin función de actualización
 */
export const columns: ColumnDef<Equipment>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Tipo',
    accessorKey: 'type',
    accessorFn: (row) => row.type, // Para filtrado
    id: 'type', // Usar "type" en lugar de "equipmentType"
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = equipmentTypeColors[value] || "#6b7280"; // Default to gray-500
      return (
        <Badge 
          className="max-w-[220px] h-6 flex items-center justify-center text-xs truncate px-2" 
          style={{ backgroundColor, color: 'white' }}
        >
          {value}
        </Badge>
      );
    },
  },
  {
    header: 'Dispositivos',
    accessorKey: 'deviceCount',
    cell: ({ row }) => {
      const count = row.original.deviceCount || 0;
      return <span>{count}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}} />
  }
];
