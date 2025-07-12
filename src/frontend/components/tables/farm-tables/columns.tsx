/**
 * Configuración de columnas para la tabla de granjas
 * Define las columnas visibles, formato de datos y acciones disponibles
 * Incluye configuración de acciones y navegación a detalles
 */

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Farm } from '@/types';

/**
 * Columnas principales de la tabla de granjas
 * Incluye información básica de la granja y acciones de gestión
 */
export const columns: ColumnDef<Farm>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Identificador',
    accessorKey: 'idname',
  },  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}}/>
  }
];

/**
 * Columnas alternativas para la tabla de granjas
 * Versión simplificada sin acciones, usada en modales y selección
 */
export const columnsAlternative: ColumnDef<Farm>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Identificador',
    accessorKey: 'idname',
  }
];
