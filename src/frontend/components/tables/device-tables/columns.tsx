'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Device } from '@/types';
import { Badge } from '@/components/ui/badge';
import { devicesColors } from '@/constants/data';


export const columns: ColumnDef<Device>[] = [
  {
    header: 'Identificador de placa',
    accessorKey: 'boardId',
  },
  {
    header: 'Granja',
    accessorKey: 'farm.name',
  },
  {
    header: 'Tipo',
    accessorKey: 'type',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = devicesColors[value];
      return <Badge className="max-w-[220px] h-6 flex items-center justify-center text-xs truncate px-2" style={{ backgroundColor, color: 'white' }}>{value}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}}/>
  }
];

