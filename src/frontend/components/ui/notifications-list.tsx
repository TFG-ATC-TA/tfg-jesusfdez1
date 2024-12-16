'use client'

import React, { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, AlertCircle, AlertTriangle, Check, Info, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const notifications = [
    {
      id: '1',
      type: 'info',
      message: 'Se ha actualizado el firmware del dispositivo D001',
      read: false,
      farm: 'Granja Norte',
      equipment: 'Sensor de humedad',
      device: 'D001',
      createdAt: '2023-09-01T10:00:00Z'
    },
    {
      id: '2',
      type: 'warning',
      message: 'Nivel de batería bajo en el dispositivo D002',
      read: false,
      farm: 'Granja Sur',
      equipment: 'Estación meteorológica',
      device: 'D002',
      createdAt: '2023-09-02T14:30:00Z'
    },
    {
      id: '3',
      type: 'error',
      message: 'Fallo de conexión con el dispositivo D003',
      read: false,
      farm: 'Granja Este',
      equipment: 'Sistema de riego',
      device: 'D003',
      createdAt: '2023-09-03T09:15:00Z'
    },
    {
      id: '4',
      type: 'info',
      message: 'Mantenimiento programado para el equipo E001',
      read: true,
      farm: 'Granja Oeste',
      equipment: 'Tractor',
      device: 'E001',
      createdAt: '2023-06-04T11:45:00Z'
    },
    {
      id: '5',
      type: 'warning',
      message: 'Detección de posible plaga en el sector S001',
      read: true,
      farm: 'Granja Central',
      equipment: 'Dron de vigilancia',
      device: 'D004',
      createdAt: '2023-06-05T16:20:00Z'
    },
    {
        id: '6',
        type: 'warning',
        message: 'Detección de posible plaga en el sector S001',
        read: true,
        farm: 'Granja Central',
        equipment: 'Dron de vigilancia',
        device: 'D004',
        createdAt: '2023-06-05T16:20:00Z'
      }
  ];
  
type Notification = typeof notifications[0]

function formatTimeAgo(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'ahora'
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'info':
      return <div className="bg-blue-500 dark:bg-blue-600 p-2.5 rounded-lg"><Info className="h-5 w-5 text-white" /></div>
    case 'warning':
      return <div className="bg-yellow-500 dark:bg-yellow-600 p-2.5 rounded-lg"><AlertTriangle className="h-5 w-5 text-white" /></div>
    case 'error':
      return <div className="bg-red-500 dark:bg-red-600 p-2.5 rounded-lg"><AlertCircle className="h-5 w-5 text-white" /></div>
  }
}

const columns: ColumnDef<Notification>[] = [
  {
    id: 'notification',
    header: '',
    cell: ({ row }) => {
      const message = row.original.message
      const type = row.original.type
      const read = row.original.read
      const date = new Date(row.original.createdAt)
      const farm = row.original.farm
      const device = row.original.device
      
      return (
        <div className={`flex items-start py-2 px-4 transition-colors relative
          ${!read ? 'bg-blue-100/100 dark:bg-blue-950/40'  : 
          'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
          <div className="flex-shrink-0">
            {getNotificationIcon(type)}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className={`text-sm ${!read ? 
                'font-bold text-blue-900 dark:text-blue-100' : 
                'text-gray-700 dark:text-gray-300'}`}>
                {farm}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(date)}</span>
            </div>
            <p className={`text-sm mt-0.5 ${!read ? 
              'text-gray-900 dark:text-gray-100 font-medium break-words' : 
              'text-gray-600 dark:text-gray-400 break-words'}`}>
              {message}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">Dispositivo {device}</span>
              {!read && (
                <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full ml-2"/>
              )}
            </div>
          </div>
        </div>
      )
    }
  }
]

const PageSelector = ({ table }: { table: any }) => {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>Página</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="w-[60px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
          <span>{currentPage}</span>
          <ChevronDown className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[60px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
          {Array.from({ length: totalPages }, (_, i) => (
            <DropdownMenuItem key={i} onSelect={() => table.setPageIndex(i)}>
              {i + 1}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <span>de {totalPages}</span>
    </div>
  )
}

export default function NotificationsList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const table = useReactTable({
    data: notifications,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    pageCount: Math.ceil(notifications.length / 5),
  })

  return (
    <div className="space-y-4 flex flex-col min-h-[520px]"> 
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Buscar notificaciones..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={(table.getColumn('type')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de notificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="info">Información</SelectItem>
              <SelectItem value="warning">Advertencia</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn('farm')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('farm')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por granja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las granjas</SelectItem>
              {Array.from(new Set(notifications.map(n => n.farm))).map(farm => (
                <SelectItem key={farm} value={farm}>{farm}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg shadow-sm overflow-hidden border-gray-200 dark:border-gray-700 flex-1"> {/* añadido flex-1 */}
        <Table>
          <TableBody className="bg-transparent">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-transparent [&:not(:last-child)]:border-b"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-[400px] text-center text-gray-500 dark:text-gray-400"> {/* altura fija para estado vacío */}
                  No hay notificaciones nuevas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center justify-center sm:justify-between mt-auto"> 
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
          <span>Página</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-[60px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
              <span>{table.getState().pagination.pageIndex + 1}</span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[60px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <DropdownMenuItem key={i} onSelect={() => table.setPageIndex(i)}>
                  {i + 1}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span>de {table.getPageCount()}</span>
        </div>
        
        <div className="flex items-center space-x-2 justify-center sm:justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

