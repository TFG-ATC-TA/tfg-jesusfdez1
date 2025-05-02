'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import { ChevronLeft, ChevronRight, Search, AlertCircle, AlertTriangle, Check, Info, ChevronsLeft, ChevronsRight, ChevronDown, CheckCheck, Filter } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

// Tipo de notificación
type Notification = {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  read: boolean;
  readDate?: string;
  farm: string;
  equipment: string;
  device: string;
  createdAt: string;
};

type NotificationResponse = {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    info: number;
    warning: number;
    error: number;
    unread: number;
  };
};

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

// Componente para filtros con checkboxes
const FilterSelector = ({ title, options, selectedValues, onSelectionChange, isScrollable = false }: {
  title: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  isScrollable?: boolean;
}) => {
  const handleCheckboxChange = (value: string) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(updatedValues);
  };

  const handleSelectAll = () => {
    const allValues = options.map(option => option.value);
    onSelectionChange(allValues);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  // Ordenar opciones alfabéticamente si es scrollable (para granjas)
  const sortedOptions = isScrollable 
    ? [...options].sort((a, b) => a.label.localeCompare(b.label))
    : options;

  const maxVisibleItems = 5;
  const shouldScroll = isScrollable && sortedOptions.length > maxVisibleItems;
  const allSelected = selectedValues.length === options.length;
  const noneSelected = selectedValues.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full sm:w-[250px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between px-3 py-2 cursor-pointer rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="truncate">{title}</span>
          {selectedValues.length > 0 && !allSelected && (
            <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
              {selectedValues.length}
            </span>
          )}
          {isScrollable && allSelected && (
            <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 flex-shrink-0">
              Todas
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={`w-[250px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 ${
          shouldScroll ? 'max-h-[240px] overflow-y-auto' : ''
        }`}
        align="start"
      >
        {isScrollable && options.length > 3 && (
          <div className="border-b border-gray-200 dark:border-gray-600 mb-1">
            <DropdownMenuItem
              className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1.5"
              onSelect={(e) => {
                e.preventDefault();
                if (allSelected) {
                  handleDeselectAll();
                } else {
                  handleSelectAll();
                }
              }}
            >
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </span>
            </DropdownMenuItem>
          </div>
        )}
        {sortedOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="flex items-center space-x-2 cursor-default focus:bg-gray-100 dark:focus:bg-gray-700 px-2 py-1.5"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div onClick={(e) => e.stopPropagation()} className="flex items-center w-full space-x-2">
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => handleCheckboxChange(option.value)}
                className="flex-shrink-0"
              />
              <span className="pointer-events-none truncate flex-1 text-sm">{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
        {sortedOptions.length === 0 && (
          <DropdownMenuItem className="text-gray-500 dark:text-gray-400 text-center cursor-default py-3 text-sm">
            No hay opciones disponibles
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
  const { data: session } = useSession();
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [notificationData, setNotificationData] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([])
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([])
  const [selectedFarmFilters, setSelectedFarmFilters] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalNotifications: 0,
    hasNext: false,
    hasPrev: false
  })

  // Función para obtener las granjas disponibles
  const fetchFarms = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch('http://localhost:5001/farm/listName', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });

      if (response.ok) {
        const farmsData = await response.json();
        setFarms(farmsData);
        // Por defecto, seleccionar todas las granjas
        setSelectedFarmFilters(farmsData.map((farm: any) => farm.name));
      }
    } catch (error) {
      console.error('Error al obtener granjas:', error);
    }
  };

  // Función para obtener notificaciones del servidor
  const fetchNotifications = async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Parámetros básicos
      params.append('page', (pagination.pageIndex + 1).toString());
      params.append('limit', pagination.pageSize.toString());
      
      // Término de búsqueda
      if (globalFilter.trim()) {
        params.append('searchTerm', globalFilter);
      }
      
      // Filtro de tipo - solo si hay alguno seleccionado
      if (selectedTypeFilters.length > 0) {
        params.append('type', selectedTypeFilters.join(','));
      }
      
      // Filtro de granja - solo si hay alguna seleccionada Y no están todas seleccionadas
      const allFarmsSelected = farms.length > 0 && selectedFarmFilters.length === farms.length;
      if (selectedFarmFilters.length > 0 && !allFarmsSelected) {
        params.append('farm', selectedFarmFilters.join(','));
      }

      const response = await fetch(`http://localhost:5001/notification/list?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }

      const data: NotificationResponse = await response.json();
      console.log('Datos recibidos del servidor:', data); // Para debugging
      
      setNotificationData(data.notifications);
      setServerPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalNotifications: data.pagination.totalNotifications,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev
      });

      // Disparar evento personalizado para actualizar estadísticas en la página principal
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
          detail: data.stats 
        }));
      }

    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`http://localhost:5001/notification/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });

      if (response.ok) {
        // Actualizar localmente
        setNotificationData(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true, readDate: new Date().toISOString() }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Efecto para cargar granjas al inicio
  useEffect(() => {
    if (session?.accessToken) {
      fetchFarms();
    }
  }, [session]);

  // Efecto para cargar datos cuando cambian los filtros o paginación
  useEffect(() => {
    fetchNotifications();
  }, [session, pagination.pageIndex, pagination.pageSize, globalFilter, selectedTypeFilters, selectedFarmFilters]);

  // Auto-marcar como leídas después de 3 segundos
  useEffect(() => {
    if (notificationData.length > 0) {
      const timer = setTimeout(() => {
        const unreadNotifications = notificationData.filter(n => !n.read);
        unreadNotifications.forEach(notification => {
          markAsRead(notification.id);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationData]);

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
                <div className="flex items-center ml-2">
                  {read ? (
                    <CheckCheck className="w-4 h-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full"/>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    }
  ]

  const table = useReactTable({
    data: notificationData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualPagination: true, // Usar paginación del servidor
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    pageCount: serverPagination.totalPages,
  })

  return (
    <div className="space-y-4 flex flex-col min-h-[520px]"> 
      {/* Header compacto con búsqueda y filtros en línea */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Barra de búsqueda */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Buscar notificaciones..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 pr-4 w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        
        {/* Filtros compactos */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <FilterSelector
              title="Tipo"
              options={[
                { value: 'info', label: 'Información' },
                { value: 'warning', label: 'Advertencia' },
                { value: 'error', label: 'Error' }
              ]}
              selectedValues={selectedTypeFilters}
              onSelectionChange={setSelectedTypeFilters}
            />
          </div>
          <div className="flex-1 sm:flex-none">
            <FilterSelector
              title="Granja"
              options={farms.map(farm => ({ value: farm.name, label: farm.name }))}
              selectedValues={selectedFarmFilters}
              onSelectionChange={setSelectedFarmFilters}
              isScrollable={true}
            />
          </div>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto"> 
        <div className="flex items-center space-x-2 text-sm pb-4 justify-center sm:pb-0 sm:justify-start">
          <span>Página</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                role="combobox" 
                className="w-[60px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between"
              >
                {table.getState().pagination.pageIndex + 1}
                <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center"
              className="w-[60px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500"
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              {Array.from({ length: table.getPageCount() }, (_, i) => {
                const pageNumber = i + 1;
                const currentPageIndex = table.getState().pagination.pageIndex + 1;
                return (
                  <DropdownMenuItem 
                    key={`page-${pageNumber}`}
                    onSelect={(e) => {
                      e.preventDefault();
                      table.setPageIndex(i);
                    }}
                    className={`justify-center ${pageNumber === currentPageIndex ? 'bg-gray-100 dark:bg-gray-700' : ''} hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    {pageNumber}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <span>de {table.getPageCount()}</span>
        </div>
        
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                table.setPageIndex(0);
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault(); 
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                table.setPageIndex(table.getPageCount() - 1);
              }}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

