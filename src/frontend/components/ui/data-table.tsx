"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ChevronDown } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTableSearch } from "./data-table-search"
import { DataTableFilters } from "./data-table-filters"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  enableColumnSelection?: boolean
  enableRowNumbering?: boolean
  showSearchBar?: boolean
  filters?: string[]
  filterOptions?: Record<string, string[]>
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: (selectedRowIds: Record<string, boolean>) => void
  onPageChange?: (newPage: number) => void
  onSearchChange?: (term: string) => void
  currentPage?: number
  totalPages?: number
  limit?: number
  totalItems?: number
  onFilterChange?: (filters: Record<string, string[]>) => void
  containerClassName?: string // Nueva prop para personalizar el contenedor
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
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    onRowSelectionChange: (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        onRowSelectionChange?.(updaterOrValue(rowSelection))
      } else {
        onRowSelectionChange?.(updaterOrValue)
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
    onSearchChange?.(globalFilter)
  }, [globalFilter])

  return { table, handleSearch, globalFilter }
}

const columnNames: Record<string, string> = {
  role: "rol",
  type: "tipo",
  // Añadir más mapeos de id a nombres de columnas si es necesario
}

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
  containerClassName = "w-full border rounded-md shadow-sm", // Valor por defecto sin max-width
}: DataTableProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [maxTotalItems, setMaxTotalItems] = useState(0)
  const numberColumn: ColumnDef<TData> = {
    id: "number",
    header: () => <div className="pl-4">#</div>,
    cell: ({ row }) => {
      const rowNumber = (currentPage - 1) * (limit || 10) + (row.index + 1)
      return <div className="pl-4">{rowNumber}</div>
    },
    size: 50,
    minSize: 50,
    maxSize: 50,
  }

  const checkboxColumn: ColumnDef<TData> = {
    id: "select",
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
    minSize: 50,
    maxSize: 50,
  }

  const allColumns = enableRowNumbering
    ? [...(enableColumnSelection ? [checkboxColumn] : []), numberColumn, ...columns]
    : [...(enableColumnSelection ? [checkboxColumn] : []), ...columns]

  const { table, handleSearch, globalFilter } = useDataTable({
    data,
    columns: allColumns,
    rowSelection,
    onRowSelectionChange,
    onPageChange,
    onSearchChange,
    currentPage,
    limit,
  })

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.minHeight = `${tableContainerRef.current.offsetHeight}px`
    }
  }, [data])

  useEffect(() => {
    if (totalItems > maxTotalItems) {
      setMaxTotalItems(totalItems)
    }
  }, [totalItems, maxTotalItems])

  const initialSelectedFilters = useMemo(() => {
    const initial: Record<string, string[]> = {}
    filters.forEach((filter) => {
      initial[filter] = filterOptions[filter] ? [...filterOptions[filter]] : []
    })
    return initial
  }, [filters, filterOptions])

  const [selectedFiltersState, setSelectedFiltersState] = useState<Record<string, string[]>>(initialSelectedFilters)

  useEffect(() => {
    onFilterChange?.(selectedFiltersState)
  }, [selectedFiltersState, onFilterChange])

  const memoizedHandleFilterChange = useCallback(
    (filters: Record<string, string[]>) => {
      setSelectedFiltersState(filters)
      onPageChange?.(1)
    },
    [onPageChange],
  )

  const PageSelector = () => {
    if (totalPages <= 1) return null
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
              <DropdownMenuItem key={i} onSelect={() => onPageChange?.(i + 1)}>
                {i + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span>de {totalPages}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 xl:space-y-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-center lg:gap-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-4 w-full justify-center">
          {showSearchBar && <DataTableSearch value={globalFilter} onChange={handleSearch} />}
          <DataTableFilters
            filters={filters}
            data={data}
            selectedFilters={selectedFiltersState}
            onFilterChange={memoizedHandleFilterChange}
            filterOptions={filterOptions}
          />
        </div>
        {enableColumnSelection && (
          <div className="text-sm text-muted-foreground">
            {Object.values(rowSelection).filter((v) => v).length} de {maxTotalItems} fila(s) seleccionada(s)
          </div>
        )}
      </div>
      {/* Contenedor principal con clases personalizables desde props */}
      <div ref={tableContainerRef} className={containerClassName}>
        {/* Contenedor de scroll horizontal con ancho fijo */}
        <div className="w-full overflow-x-auto rounded-md" style={{ maxWidth: "100%" }}>
          {/* Tabla con anchos para columnas pero sin forzar dimensiones del contenedor */}
          <Table className="w-full" style={{ tableLayout: "auto" }}>
            <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={`font-bold text-black dark:text-white px-4 py-2 ${!enableRowNumbering && index === 0 ? "pl-4" : ""}`}
                      style={{ 
                        minWidth: header.column.columnDef.minSize || (header.id === 'number' || header.id === 'select' ? 50 : 120)
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none flex items-center"
                              : "flex items-center",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          <span className="whitespace-nowrap">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />}
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "seleccionado"}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={`px-3 py-1.5 ${!enableRowNumbering && index === 0 ? "pl-2" : ""}`}
                        style={{ 
                          minWidth: cell.column.columnDef.minSize || (cell.column.id === 'number' || cell.column.id === 'select' ? 50 : 120)
                        }}
                      >
                        <div className="whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
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