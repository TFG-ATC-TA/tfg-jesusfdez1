"use client";

import { useEffect, useState, useCallback, useRef } from 'react'; // Añadido useRef
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Device } from '@/types/index';
import { columns } from '@/components/tables/device-tables/columns';
import PageContainer from '@/components/layout/page-container';
import DeviceAddModal from '@/components/modals/device-add-modal';
import {CellAction} from '@/components/tables/device-tables/cell-action';

const DeviceClient: React.FC = () => {
  const { data: session } = useSession();
  const [data, setData] = useState<Device[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const isFetchingRef = useRef(false); // Añadido
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const filterOptions = { // Movido arriba
    type: ["Monitor de leche", "Monitor de tanque", "Monitor de estación de lavado"],
  };
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({ // Inicializado con todos los filtros seleccionados
    type: [...filterOptions.type],
  });

  const fetchDevices = useCallback(async () => {
    if (!session?.accessToken || isFetchingRef.current) {
      console.error('No hay sesión iniciada o ya se está realizando una petición');
      return;
    }

    isFetchingRef.current = true; // Establecer el flag
    try {
      const typesQuery = selectedFilters['type'] ? selectedFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters); // Convertir los filtros seleccionados a JSON
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/device/list?page=${page}&limit=10&searchTerm=${searchTerm}&types=${typesQuery}&filters=${encodeURIComponent(filtersQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener dispositivos');
      }
      const result = await response.json();
      setData(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
    } finally {
      isFetchingRef.current = false; // Reiniciar el flag
    }
  }, [session, page, searchTerm, selectedFilters]); // Eliminar isFetching de las dependencias

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices, page, searchTerm, selectedFilters]);

  const updatedColumns = columns.map(column => {
    if (column.id === 'actions') {
      return {
        ...column,
        cell: ({ row }: { row: { original: Device } }) => <CellAction data={row.original} onRefresh={fetchDevices} />
      };
    }
    return column;
  });

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
  };

  return (
    <>    
    <PageContainer scrollable={true}>
    <div className="space-y-2  mb-16 md:mb-0">
    <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispositivos ({totalItems})</h2>
          <h3 className="text-md text-muted-foreground mt-2 mb-4">
            Gestiona los dispositivos disponibles y visualiza su información
          </h3>
        </div>
        
        <Button
          className="text-xs md:text-sm flex items-center justify-center"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline ml-2">Añadir dispositivo</span>
        </Button>
      </div>

      <div className="my-4"></div>
      <DataTable<Device>
        columns={updatedColumns}
        data={data}
        enableColumnSelection={false}
        enableRowNumbering
        showSearchBar
        filters={["type"]}
        filterOptions={filterOptions} 
        currentPage={page}
        totalPages={totalPages}
        limit={10}
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(term) => setSearchTerm(term)}
        onFilterChange={handleFilterChange}
        containerClassName="w-full border rounded-md shadow-sm max-w-[87vw]"
      />
     </div>
    </PageContainer>
    <DeviceAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onRefresh={fetchDevices} />
    </>
  );
};
export default DeviceClient;
