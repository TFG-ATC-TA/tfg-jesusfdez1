'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { logger } from '@/lib/logger'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search, AlertCircle, AlertTriangle, HelpCircle, Info, ChevronsLeft, ChevronsRight, ChevronDown, CheckCheck, Filter } from 'lucide-react'
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
      return <div className="bg-blue-500 dark:bg-blue-600 p-2.5 rounded-lg flex items-center justify-center"><Info className="h-5 w-5 text-white" /></div>
    case 'warning':
      return <div className="bg-yellow-500 dark:bg-yellow-600 p-2.5 rounded-lg flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-white" /></div>
    case 'error':
      return <div className="bg-red-500 dark:bg-red-600 p-2.5 rounded-lg flex items-center justify-center"><AlertCircle className="h-5 w-5 text-white" /></div>
    default:
      return <div className="bg-gray-500 dark:bg-gray-600 p-2.5 rounded-lg flex items-center justify-center"><HelpCircle className="h-5 w-5 text-white" /></div>
  
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
  
  // Verificar si todas las opciones están seleccionadas comparando los values
  const allOptionValues = options.map(option => option.value);
  const allSelected = allOptionValues.length > 0 && 
    allOptionValues.every(value => selectedValues.includes(value)) &&
    selectedValues.length === allOptionValues.length;
  
  const _noneSelected = selectedValues.length === 0;

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

const _PageSelector = ({ table }: { table: { getState: () => { pagination: { pageIndex: number } }; getPageCount: () => number; setPageIndex: (index: number) => void } }) => {
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
  const [_isLoading, setIsLoading] = useState(true)
  const [farms, setFarms] = useState<{ _id: string; name: string }[]>([])
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>(['info', 'warning', 'error', 'otros'])
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
  
  // Estado para rastrear las estadísticas actuales
  const [_currentStats, setCurrentStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    unread: 0
  });
  
  // Variables para el control de paginación y filtros como en DataTable
  const [pageChangeTriggered, setPageChangeTriggered] = useState(false)
  const prevGlobalFilterRef = useRef(globalFilter)
  const prevSelectedTypeFiltersRef = useRef(selectedTypeFilters)
  const prevSelectedFarmFiltersRef = useRef(selectedFarmFilters)

  // Inicializar las referencias con los valores actuales
  useEffect(() => {
    prevGlobalFilterRef.current = globalFilter;
    prevSelectedTypeFiltersRef.current = selectedTypeFilters;
    prevSelectedFarmFiltersRef.current = selectedFarmFilters;
  }, [globalFilter, selectedTypeFilters, selectedFarmFilters]);

  // Función para obtener las granjas disponibles
  const fetchFarms = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/farm/listName`, {
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
        setSelectedFarmFilters(farmsData.map((farm: { _id: string; name: string }) => farm._id));
      }
    } catch (error) {
      console.error('Error al obtener granjas:', error);
    }
  }, [session?.accessToken]);

  // Función para obtener notificaciones del servidor
  const fetchNotifications = useCallback(async () => {
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
        // Separar tipos específicos y "otros"
        const specificTypes = selectedTypeFilters.filter(type => type !== 'otros');
        const hasOtros = selectedTypeFilters.includes('otros');
        
        if (specificTypes.length > 0 && hasOtros) {
          // Si se seleccionan tipos específicos Y "otros", enviar los específicos + "otros"
          params.append('type', [...specificTypes, 'otros'].join(','));
        } else if (specificTypes.length > 0) {
          // Solo tipos específicos
          params.append('type', specificTypes.join(','));
        } else if (hasOtros) {
          // Solo "otros"
          params.append('type', 'otros');
        }
      }
      
      // Filtro de granja - solo si hay alguna seleccionada específicamente
      if (selectedFarmFilters.length > 0) {
        // Enviar los IDs de las granjas seleccionadas
        params.append('farm', selectedFarmFilters.join(','));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notification/list?${params}`, {
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
      logger.log('Datos recibidos del servidor:', data); // Para debugging
      
      setNotificationData(data.notifications);
      setServerPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalNotifications: data.pagination.totalNotifications,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev
      });

      // Actualizar estadísticas locales
      setCurrentStats(data.stats);

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
  }, [session?.accessToken, pagination.pageIndex, pagination.pageSize, globalFilter, selectedTypeFilters, selectedFarmFilters]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string, skipLocalUpdate = false) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notification/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });

      if (response.ok && !skipLocalUpdate) {
        // Actualizar localmente solo si no se debe saltar la actualización local
        setNotificationData(prev => {
          const updatedData = prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true, readDate: new Date().toISOString() }
              : notification
          );
          
          return updatedData;
        });
        
        // Actualizar estadísticas locales (solo decrementar unread)
        setCurrentStats(prev => {
          const newStats = {
            ...prev,
            unread: Math.max(0, prev.unread - 1)
          };
          
          // Disparar evento personalizado para actualizar estadísticas en la página principal
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notificationReadStatusChanged', { 
              detail: newStats 
            }));
          }
          
          return newStats;
        });
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }, [session?.accessToken]);

  // Funciones auxiliares para el manejo de paginación y búsqueda (similar a DataTable)
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      pageIndex: newPage - 1
    }))
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(event.target.value);
  };

  // Efecto para cargar granjas al inicio
  useEffect(() => {
    if (session?.accessToken) {
      fetchFarms();
    }
  }, [session, fetchFarms]);

  // Actualizar pageIndex cuando serverPagination.currentPage cambia
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: (serverPagination.currentPage || 1) - 1
    }))
  }, [serverPagination.currentPage])

  // Detectar cuando currentPage es mayor que totalPages y ajustar
  useEffect(() => {
    // Solo realizamos la actualización si:
    // 1. La página actual es mayor que el total de páginas
    // 2. Hay páginas disponibles (totalPages > 0)
    // 3. No estamos en medio de una actualización de página (evita bucles)
    if (serverPagination.totalPages > 0 && 
        serverPagination.currentPage > serverPagination.totalPages && 
        !pageChangeTriggered) {
      setPageChangeTriggered(true);
      setPagination(prev => ({
        ...prev,
        pageIndex: (serverPagination.totalPages || 1) - 1
      }))
    } else if (serverPagination.currentPage <= serverPagination.totalPages) {
      // Reseteamos el estado cuando la condición ya no aplica
      setPageChangeTriggered(false);
    }
  }, [serverPagination.currentPage, serverPagination.totalPages, pageChangeTriggered])

  // Cuando cambia el filtro global, volver a la página 1
  useEffect(() => {
    if (prevGlobalFilterRef.current !== globalFilter) {
      // Solo cambiar de página si el filtro cambió y no estamos ya en la página 1
      if (serverPagination.currentPage !== 1) {
        setPagination(prev => ({
          ...prev,
          pageIndex: 0
        }))
      }
      prevGlobalFilterRef.current = globalFilter;
    }
  }, [globalFilter, serverPagination.currentPage]);

  // Cuando cambian los filtros de tipo, volver a la página 1
  useEffect(() => {
    if (JSON.stringify(prevSelectedTypeFiltersRef.current) !== JSON.stringify(selectedTypeFilters)) {
      // Solo cambiar de página si los filtros cambiaron y no estamos ya en la página 1
      if (serverPagination.currentPage !== 1) {
        setPagination(prev => ({
          ...prev,
          pageIndex: 0
        }))
      }
      prevSelectedTypeFiltersRef.current = selectedTypeFilters;
    }
  }, [selectedTypeFilters, serverPagination.currentPage]);

  // Cuando cambian los filtros de granja, volver a la página 1
  useEffect(() => {
    if (JSON.stringify(prevSelectedFarmFiltersRef.current) !== JSON.stringify(selectedFarmFilters)) {
      // Solo cambiar de página si los filtros cambiaron y no estamos ya en la página 1
      if (serverPagination.currentPage !== 1) {
        setPagination(prev => ({
          ...prev,
          pageIndex: 0
        }))
      }
      prevSelectedFarmFiltersRef.current = selectedFarmFilters;
    }
  }, [selectedFarmFilters, serverPagination.currentPage]);

  // Efecto para cargar datos cuando cambian los filtros o paginación
  useEffect(() => {
    fetchNotifications();
  }, [session, pagination.pageIndex, pagination.pageSize, globalFilter, selectedTypeFilters, selectedFarmFilters, fetchNotifications]);

  // Auto-marcar como leídas después de 3 segundos
  useEffect(() => {
    if (notificationData.length > 0) {
      const timer = setTimeout(() => {
        const unreadNotifications = notificationData.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
          // Marcar todas las notificaciones no leídas de una vez
          const unreadIds = unreadNotifications.map(n => n.id);
          
          // Actualizar el estado local primero
          setNotificationData(prev => 
            prev.map(notification => 
              unreadIds.includes(notification.id)
                ? { ...notification, read: true, readDate: new Date().toISOString() }
                : notification
            )
          );
          
          // Actualizar estadísticas locales
          setCurrentStats(prev => {
            const newStats = {
              ...prev,
              unread: Math.max(0, prev.unread - unreadNotifications.length)
            };
            
            // Disparar evento personalizado para actualizar estadísticas en la página principal
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('notificationReadStatusChanged', { 
                detail: newStats 
              }));
            }
            
            return newStats;
          });
          
          // Enviar las peticiones al servidor de forma asíncrona (con skipLocalUpdate=true)
          unreadNotifications.forEach(notification => {
            markAsRead(notification.id, true);
          });
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationData, markAsRead]);

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
          <div className={`flex items-center py-3 px-4 transition-colors relative
            ${!read ? 'bg-blue-100/100 dark:bg-blue-950/40'  : 
            'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
            <div className="flex-shrink-0 self-start mt-1">
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
            onChange={handleSearch}
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
                { value: 'error', label: 'Error' },
                { value: 'otros', label: 'Otros' }
              ]}
              selectedValues={selectedTypeFilters}
              onSelectionChange={setSelectedTypeFilters}
            />
          </div>
            <div className="flex-1 sm:flex-none">
            <FilterSelector
              title="Granja"
              options={farms.map(farm => ({ value: farm._id, label: farm.name }))}
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
                {serverPagination.currentPage}
                <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center"
              className="w-[60px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500"
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              {Array.from({ length: serverPagination.totalPages }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <DropdownMenuItem 
                    key={`page-${pageNumber}`}
                    onSelect={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNumber);
                    }}
                    className={`justify-center ${pageNumber === serverPagination.currentPage ? 'bg-gray-100 dark:bg-gray-700' : ''} hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    {pageNumber}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <span>de {serverPagination.totalPages}</span>
        </div>
        
        {serverPagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
              disabled={serverPagination.currentPage <= 1}
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
                handlePageChange(serverPagination.currentPage - 1);
              }}
              disabled={serverPagination.currentPage <= 1}
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
                handlePageChange(serverPagination.currentPage + 1);
              }}
              disabled={serverPagination.currentPage >= serverPagination.totalPages}
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
                handlePageChange(serverPagination.totalPages);
              }}
              disabled={serverPagination.currentPage >= serverPagination.totalPages}
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

