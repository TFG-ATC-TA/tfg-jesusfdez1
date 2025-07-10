'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { MilkCollection } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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