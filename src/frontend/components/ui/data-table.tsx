'use client'

import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Filter, ChevronDown } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  enableColumnSelection?: boolean
  enableRowNumbering?: boolean
  showSearchBar?: boolean 
  filters?: string[] 
  filterOptions?: Record<string, string[]> // Añadido
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (selectedRowIds: Record<string, boolean>) => void
  onPageChange?: (newPage: number) => void; 
  onSearchChange?: (term: string) => void;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  totalItems?: number; // Añadido
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

function useDataTable<TData>({
  data,
  columns,
  rowSelection = {},
  onRowSelectionChange,
  onPageChange,
  onSearchChange,
  currentPage, // Añadido
  limit,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    onRowSelectionChange: (updaterOrValue) => {
      if (typeof updaterOrValue === 'function') {
        onRowSelectionChange?.(updaterOrValue(rowSelection));
      } else {
        onRowSelectionChange?.(updaterOrValue);
      }
    },
    getRowId: (row) => (row as any)._id,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      pagination: {
        pageIndex: (currentPage ?? 1) - 1,
        pageSize: limit ?? 10,
      },
    },
    manualPagination: true, // Añadido para manejar la paginación manualmente
    pageCount: undefined, // Opcionalmente puedes manejar el pageCount
  })

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(event.target.value)
  }

  // Eliminar el useEffect que causa el bucle infinito
  /*
  React.useEffect(() => {
    onPageChange?.(table.getState().pagination.pageIndex + 1);
  }, [table.getState().pagination.pageIndex]);
  */

  React.useEffect(() => {
    // Avisar cuando cambie el filtro global
    onSearchChange?.(globalFilter);
  }, [globalFilter]);

  return { table, handleSearch, globalFilter }
}

const columnNames: Record<string, string> = {
  role: 'rol',
  type: 'tipo',
  // Añadir más mapeos de id a nombres de columnas si es necesario
};

export function DataTable<TData>({
  columns,
  data,
  enableColumnSelection,
  enableRowNumbering = true,
  showSearchBar = true, 
  filters = [], 
  filterOptions = {}, 
  rowSelection = {},
  onRowSelectionChange,
  onPageChange,
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  limit,
  totalItems = 0, 
  onFilterChange,
}: DataTableProps<TData>) {

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [maxTotalItems, setMaxTotalItems] = useState(0);
  const numberColumn: ColumnDef<TData> = {
    id: 'number',
    header: () => <div className="pl-4">#</div>,
    cell: ({ row }) => {
      const rowNumber = ((currentPage - 1) * (limit || 10)) + (row.index + 1);
      return <div className="pl-4">{rowNumber}</div>;
    },
    size: 50,
  }

  const checkboxColumn: ColumnDef<TData> = {
    id: 'select',
    header: () => null,
    cell: ({ row }) => (
      <div className="pl-4 pr-0">
        <Checkbox
          checked={rowSelection[row.id] || false}
          onCheckedChange={() => {
            const newSelection = { ...rowSelection, [row.id]: !rowSelection[row.id] }
            onRowSelectionChange?.(newSelection)
          }}
        />
      </div>
    ),
    size: 50,
  }

  const allColumns = enableRowNumbering
    ? [...(enableColumnSelection ? [checkboxColumn] : []), numberColumn, ...columns]
    : [...(enableColumnSelection ? [checkboxColumn] : []), ...columns]

  const { table, handleSearch, globalFilter } = useDataTable({ data, columns: allColumns, rowSelection, onRowSelectionChange, onPageChange, onSearchChange, currentPage })

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.minHeight = `${tableContainerRef.current.offsetHeight}px`;
    }
  }, [data]);

  useEffect(() => {
    if (totalItems > maxTotalItems) {
      setMaxTotalItems(totalItems);
    }
  }, [totalItems, maxTotalItems]);

  const PageSelector = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center space-x-2 text-sm pb-4 justify-center sm:pb-0 sm:justify-start">
        <span>Página</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-[60px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
            <span>{currentPage}</span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[60px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            {Array.from({ length: totalPages }, (_, i) => (
              <DropdownMenuItem
                key={i}
                onSelect={() => onPageChange?.(i + 1)}
              >
                {i + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span>de {totalPages}</span>
      </div>
    );
  };

  // Eliminar estado local de selectedFilters
  // const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const initialSelectedFilters = useMemo(() => {
    const initial: Record<string, string[]> = {};
    filters.forEach(filter => {
      initial[filter] = filterOptions[filter] ? [...filterOptions[filter]] : [];
    });
    return initial;
  }, [filters, filterOptions]);

  const [selectedFiltersState, setSelectedFiltersState] = useState<Record<string, string[]>>(initialSelectedFilters);

  useEffect(() => {
    onFilterChange?.(selectedFiltersState);
  }, [selectedFiltersState, onFilterChange]);

  const memoizedHandleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setSelectedFiltersState(filters);
    onPageChange?.(1); // Resetear la página a 1 al cambiar los filtros
  }, [onPageChange]);

  const FilterSelector = memo(({ filter, data, selectedFilters, onFilterChange, options }: { 
    filter: string, 
    data: any[], 
    selectedFilters: Record<string, string[]>, 
    onFilterChange: (filters: Record<string, string[]>) => void,
    options: string[] // Añadido
  }) => {
    const uniqueValues = options.length > 0 ? options : Array.from(new Set(data.map((item) => (item as Record<string, any>)[filter])));
    const filterName = columnNames[filter] || filter;

    const handleCheckboxChange = useCallback((value: string) => {
      const currentFilters = selectedFilters[filter] || [];
      const updatedFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];
      onFilterChange({
        ...selectedFilters,
        [filter]: updatedFilters
      });
    }, [filter, selectedFilters, onFilterChange]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="w-[200px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filtrar por {filterName}</span>
          </div>
          <div className="ml-auto">
            <ChevronDown className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
          {uniqueValues.map((value, index) => (
            <DropdownMenuItem
              key={index}
              className="flex items-center space-x-2 cursor-default"
              onSelect={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevenir la propagación para que el menú no se cierre
              }}
            >
              <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                <Checkbox
                  checked={selectedFilters[filter]?.includes(value) || false}
                  onCheckedChange={() => handleCheckboxChange(value)}
                />
                <span className="pointer-events-none ml-2">{value}</span>
              </div>
            </DropdownMenuItem>
          ))}        
        </DropdownMenuContent>
      </DropdownMenu>
    );
  });

  return (
    <div className="space-y-4 lg:space-y-6 xl:space-y-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-center lg:gap-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-4 w-full justify-center">
          {showSearchBar && (
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder={`Buscar...`}
                value={globalFilter}
                onChange={handleSearch}
                className="pl-8 w-full  bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700"
                aria-label={`Buscar`}
              />
            </div>
          )}
          <div className="flex space-x-2">
            {filters.map((filter) => (
              <FilterSelector 
                key={filter} 
                filter={filter} 
                data={data} 
                selectedFilters={selectedFiltersState}
                onFilterChange={memoizedHandleFilterChange} 
                options={filterOptions[filter] || []} // Añadido
              />
            ))}
          </div>
        </div>
        {enableColumnSelection && (
          <div className="text-sm text-muted-foreground">
            {Object.values(rowSelection).filter(v => v).length} de {maxTotalItems} fila(s) seleccionada(s)
          </div>
        )}
      </div>
      <div ref={tableContainerRef} className="overflow-hidden rounded-md border">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={`font-bold text-black dark:text-white ${!enableRowNumbering && index === 0 ? 'pl-4' : ''}`}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center'
                              : 'flex items-center',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'seleccionado'}>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className={!enableRowNumbering && index === 0 ? 'pl-4' : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={allColumns.length} className="h-24 text-center">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <PageSelector />
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => onPageChange?.(1)}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => onPageChange?.(totalPages)}
              disabled={currentPage >= totalPages}
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
