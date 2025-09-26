/**
 * Configuración de columnas para la tabla de recogidas de leche
 * Define las columnas visibles, formato de datos y acciones disponibles
 * Incluye formateo de fechas y configuración de acciones
 */

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { MilkCollection } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Columnas principales de la tabla de recogidas de leche
 * Incluye información de fecha, etiqueta, compañía y acciones
 */
export const columns: ColumnDef<MilkCollection>[] = [
  {
    header: 'Fecha/Hora',
    accessorKey: 'collectionDate',
    cell: ({ row }) => {
      const date = row.original.collectionDate;
      if (!date) return "Sin fecha";
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
    },
  },
  {
    header: 'Etiqueta de muestra',
    accessorKey: 'sampleLabel',
  },
  {
    header: 'Compañía de recogida',
    accessorKey: 'collectionCompany',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefreshAction={() => {}} />
  }
];
