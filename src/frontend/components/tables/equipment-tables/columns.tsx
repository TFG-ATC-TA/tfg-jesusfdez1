'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Equipment } from '@/types';
import { Badge } from '@/components/ui/badge';

// Define color mapping for equipment types
const equipmentTypeColors: Record<string, string> = {
  "Tanque de leche": "#0284c7", // sky-600
  "Estación de lavado": "#7c3aed", // violet-600
};

export const columns: ColumnDef<Equipment>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Tipo',
    accessorKey: 'type',
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
      const count = row.original.device?.length || 0;
      return <span>{count}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}}/>
  }
];