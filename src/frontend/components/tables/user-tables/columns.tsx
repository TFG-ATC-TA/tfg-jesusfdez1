'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';


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
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = roleColors[value];
      return <Badge className="max-w-[120px] h-6 flex items-center justify-center text-xs truncate px-2"  style={{ backgroundColor, color: 'white' }}>{value}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} onRefresh={() => {}}/>
  }
];

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
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const backgroundColor = roleColors[value];
      return <Badge className="w-24 h-6 flex items-center justify-center" style={{ backgroundColor, color: 'white' }}>{value}</Badge>;
    },
  }
];
