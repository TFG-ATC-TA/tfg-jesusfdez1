"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User } from '@/types/index';
import { columns } from '@/components/tables/user-tables/columns';
import PageContainer from '@/components/layout/page-container';
import UserAddModal from '@/components/modals/user-add-modal';
import {CellAction} from '@/components/tables/user-tables/cell-action';

const UserClient: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const isFetchingRef = useRef(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const filterOptions = {
    role: ["Administrador", "Veterinario", "Industria", "Ganadero"],
  };
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    role: [...filterOptions.role],
  });

  const fetchUsers = useCallback(async () => {
    if (!session?.accessToken || isFetchingRef.current) {
      console.error('No hay sesión iniciada o ya se está realizando una petición');
      return;
    }

    isFetchingRef.current = true;
    try {
      const rolesQuery = selectedFilters['role'] ? selectedFilters['role'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/list?page=${page}&limit=10&searchTerm=${searchTerm}&roles=${rolesQuery}&filters=${encodeURIComponent(filtersQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }
      const result = await response.json();
      setData(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, page, searchTerm, selectedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, page, searchTerm, selectedFilters]);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
  };

  const updatedColumns = columns.map(column => {
    if (column.id === 'actions') {
      return {
        ...column,
        cell: ({ row }: { row: { original: User } }) => <CellAction data={row.original} onRefresh={fetchUsers} />
      };
    }
    return column;
  });
  
  return (
    <>    
    <PageContainer scrollable={true}>
    <div className="space-y-2  mb-16 md:mb-0">
    <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuarios ({totalItems})</h2>
          <h3 className="text-md text-muted-foreground mt-2 mb-4">
            Gestiona los usuarios disponibles y visualiza su información
          </h3>
        </div>
        <Button
          className="text-xs md:text-sm flex items-center justify-center"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline ml-2">Añadir usuario</span>
        </Button>
        
      </div>

      <div className="my-4"></div>
      <DataTable<User>
        columns={updatedColumns}
        data={data}
        enableColumnSelection={false}
        enableRowNumbering
        showSearchBar
        filters={["role"]}
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
    <UserAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onRefresh={fetchUsers} />
    </>
  );
};
export default UserClient;
