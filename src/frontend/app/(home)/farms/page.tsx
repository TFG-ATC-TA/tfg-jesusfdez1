"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/tables/farm-tables/columns';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Farm } from '@/types/index';
import PageContainer from '@/components/layout/page-container';
import FarmAddModal from '@/components/modals/farm-add-modal'; // Importa el modal

const UserClient: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<Farm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

    const fetchFarms = async () => {
      if (!session?.accessToken) {
        console.error('No hay sesión iniciada');
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5001/farm/list?page=${page}&limit=10&searchTerm=${searchTerm}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Error al obtener granjas');
        }
        const result = await response.json();
        setData(result.data);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Error al obtener granjas:', error);
      }
    };
    
  useEffect(() => {
    fetchFarms();
  }, [page, searchTerm]);
  
  return (
    <>    
    <PageContainer scrollable={true}>
      <div className="space-y-2  mb-16 md:mb-0">
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
                onClick={() => setIsModalOpen(true)} // Abre el modal al hacer clic
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
        onPageChange={(newPage) => setPage(newPage)}
        onSearchChange={(term) => { 
          setSearchTerm(term);
          setPage(1); // Restablecer la página a 1 al cambiar el término de búsqueda
        }}
        currentPage={page}
        totalPages={totalPages}
        limit={10}
        totalItems={totalItems} 
        containerClassName="w-full border rounded-md shadow-sm max-w-[87vw]"
      />
            </div>
            </PageContainer>
      <FarmAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={() => fetchFarms()} /> {/* Renderiza el modal */}
    </>
  );
};
export default UserClient;
