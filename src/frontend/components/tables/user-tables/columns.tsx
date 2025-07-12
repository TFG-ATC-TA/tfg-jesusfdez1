/**
 * Configuración de columnas para la tabla de usuarios
 * Define las columnas visibles, formato de datos y acciones disponibles
 * Incluye mapeo de colores para roles y configuración de acciones
 * Utiliza TanStack Table para renderizado optimizado y funcionalidades avanzadas
 */

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';

/**
 * Columnas principales de la tabla de usuarios
 * Incluye acciones de edición y eliminación
 * Define la estructura visual y funcional de la tabla
 */
export const columns: ColumnDef<User>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Apellidos',
    accessorKey: 'surname',
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Rol',
    accessorKey: 'role',
    /**
     * Renderizado personalizado para la columna de rol
     * Aplica colores específicos según el rol del usuario
     * Proporciona identificación visual rápida de roles
     */
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = roleColors[value];
      return <Badge className="max-w-[120px] h-6 flex items-center justify-center text-xs truncate px-2"  style={{ backgroundColor, color: 'white' }}>{value}</Badge>;
    },
  },
  {
    id: 'actions',
    /**
     * Columna de acciones con menú desplegable
     * Incluye opciones de editar y eliminar usuario
     */
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}}/>
  }
];

/**
 * Columnas alternativas para la tabla de usuarios
 * Versión simplificada sin acciones, usada en modales y selección
 * Optimizada para casos donde no se requieren acciones CRUD
 */
export const columnsAlternative: ColumnDef<User>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Apellidos',
    accessorKey: 'surname',
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Rol',
    accessorKey: 'role',
    /**
     * Renderizado simplificado para la columna de rol
     * Usa ancho fijo para mejor alineación en modales
     */
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = roleColors[value];
      return <Badge className="w-24 h-6 flex items-center justify-center" style={{ backgroundColor, color: 'white' }}>{value}</Badge>;
    },
  }
];
