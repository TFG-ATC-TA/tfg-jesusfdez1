"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/tables/farm-tables/columns';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Farm } from '@/types/index';
import PageContainer from '@/components/layout/page-container';
import FarmAddModal from '@/components/modals/farm-add-modal';

const UserClient: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<Farm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingRef = useRef(false);
  const lastRequestedPageRef = useRef(1);

  // Controlador de cambio de página separado para evitar actualizaciones conflictivas
  const handlePageChange = useCallback((newPage: number) => {
    lastRequestedPageRef.current = newPage;
    setPage(newPage);
  }, []);

  // Controlador de cambio de búsqueda separado
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    lastRequestedPageRef.current = 1;
    setPage(1);
  }, []);

  const fetchFarms = useCallback(async () => {
    if (!session?.accessToken || isFetchingRef.current) {
      return;
    }

    const currentPage = lastRequestedPageRef.current;
    isFetchingRef.current = true;
    
    try {
      const response = await fetch(
        `http://localhost:5001/farm/list?page=${currentPage}&limit=10&searchTerm=${searchTerm}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
          // Evita el caché del navegador
          cache: 'no-store'
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener granjas');
      }
      
      const result = await response.json();
      
      // Verificamos que no haya habido un cambio de página posterior a esta solicitud
      if (currentPage === lastRequestedPageRef.current) {
        setData(result.data);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error al obtener granjas:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, searchTerm]); // Ya no incluimos page para evitar ciclos

  // Efecto que se activa cuando cambia la página o el término de búsqueda
  useEffect(() => {
    fetchFarms();
  }, [fetchFarms, page]); // Añadimos page explícitamente para que se ejecute cuando cambie
  
  return (
    <>    
    <PageContainer scrollable={true}>
      <div className="space-y-2 mb-16 md:mb-0">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Granjas ({totalItems})</h2>
          <h3 className="text-md text-muted-foreground mt-2 mb-4">
            Gestiona las granjas disponibles y visualiza su información
          </h3>
        </div>
        {session?.user?.role === 'Administrador' && (
        <Button
          className="text-xs md:text-sm flex items-center justify-center"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline ml-2">Añadir granja</span>
        </Button>
        )}
      </div>

      <div className="my-4"></div>
      <DataTable<Farm>
        columns={columns}
        data={data}
        enableColumnSelection={false}
        enableRowNumbering={true}
        onPageChange={handlePageChange}
        onSearchChange={handleSearchChange}
        currentPage={page}
        totalPages={totalPages}
        limit={10}
        totalItems={totalItems} 
        containerClassName="w-full border rounded-md shadow-sm max-w-[87vw]"
      />
      </div>
    </PageContainer>
    <FarmAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={() => {
      lastRequestedPageRef.current = 1;
      setPage(1);
      fetchFarms();
    }} />
    </>
  );
};
export default UserClient;
