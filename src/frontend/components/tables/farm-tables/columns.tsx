'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Farm } from '@/types';


export const columns: ColumnDef<Farm>[] = [
  {
    header: 'Nombre',
    accessorKey: 'name',
  },
  {
    header: 'Identificador',
    accessorKey: 'idname',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];

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
