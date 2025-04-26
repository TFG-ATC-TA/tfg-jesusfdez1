'use client'

import { useSession } from "next-auth/react"

import PageContainer from '@/components/layout/page-container'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { MilkCollection } from '@/types'
import { useEffect, useState, useCallback, useRef } from 'react';
import { columns as milkCollectionColumns } from '@/components/tables/milk-collection-tables/columns';
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import MilkCollectionAddModal from "@/components/modals/milk-collection-add-modal"
import { CellAction } from "@/components/tables/milk-collection-tables/cell-action"
import Statistics from "./farm-statistics"
import { getColumns as getEquipmentColumns } from '@/components/tables/equipment-tables/columns';
import { Equipment } from '@/types';

interface NonAdminViewProps {
  farmData: any;
}

export default function NonAdminView({ farmData }: NonAdminViewProps) {
  const { data: session } = useSession()

  // Milk collections state
  const [milkCollectionData, setMilkCollectionData] = useState<MilkCollection[]>([]);
  const [showAddMilkCollectionModal, setShowAddMilkCollectionModal] = useState(false);
  const [milkCollectionPage, setMilkCollectionPage] = useState(1);
  const [milkCollectionSearchTerm, setMilkCollectionSearchTerm] = useState('');
  const [milkCollectionTotalItems, setMilkCollectionTotalItems] = useState(0);
  const [milkCollectionTotalPages, setMilkCollectionTotalPages] = useState(1);

  // Equipment state
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [equipmentTotalItems, setEquipmentTotalItems] = useState(0);
  const [equipmentTotalPages, setEquipmentTotalPages] = useState(1);
  const [selectedEquipmentFilters, setSelectedEquipmentFilters] = useState<Record<string, string[]>>({
    type: ["Tanque de leche", "Estación de lavado"],
  });

  const isFetchingRef = useRef<string | false>(false);

  // Fetch milk collections data
  const fetchMilkCollections = useCallback(async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }
    if (isFetchingRef.current === 'collections') return;
    try {
      isFetchingRef.current = 'collections';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection/list?farmId=${farmData._id}&page=${milkCollectionPage}&limit=10&searchTerm=${milkCollectionSearchTerm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener recogidas de leche');
      }
      const result = await response.json();
      setMilkCollectionData(result.data);
      setMilkCollectionTotalItems(result.totalItems);
      setMilkCollectionTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener recogidas de leche:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, farmData._id, milkCollectionPage, milkCollectionSearchTerm]);

  // Fetch equipment data
  const fetchEquipment = useCallback(async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }
    if (isFetchingRef.current === 'equipment') return;
    try {
      isFetchingRef.current = 'equipment';
      const typesQuery = selectedEquipmentFilters['type'] ? selectedEquipmentFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedEquipmentFilters);
      const searchParams = new URLSearchParams();
      searchParams.append('farmId', farmData._id);
      searchParams.append('page', equipmentPage.toString());
      searchParams.append('limit', '10');
      searchParams.append('searchTerm', equipmentSearchTerm);
      searchParams.append('types', typesQuery);
      searchParams.append('filters', encodeURIComponent(filtersQuery));
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/list?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener equipos');
      }
      const result = await response.json();
      setEquipmentData(result.data);
      setEquipmentTotalItems(result.totalItems);
      setEquipmentTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener equipos:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, farmData._id, equipmentPage, equipmentSearchTerm, selectedEquipmentFilters]);

  // Effect to fetch milk collections data
  useEffect(() => {
    fetchMilkCollections();
  }, [fetchMilkCollections, milkCollectionPage, milkCollectionSearchTerm]);

  // Effect to fetch equipment data
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment, equipmentPage, equipmentSearchTerm, selectedEquipmentFilters]);

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <div className="flex items-start justify-between space-y-2 mb-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {farmData.name}
            </h2>
            <h3 className="text-md text-muted-foreground mt-2 mb-4">
              Visualiza toda la información sobre esta granja
            </h3>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview">Vista general</TabsTrigger>
              <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-start gap-4">
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-2xl font-bold">Recogidas de leche</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">Registro de recogidas de leche en esta granja</CardDescription>
                </div>
                <Button
                  className="text-xs md:text-sm flex items-center justify-center shrink-0"
                  onClick={() => setShowAddMilkCollectionModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2 hidden md:inline">Añadir recogida</span>
                </Button>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <DataTable<MilkCollection>
                  columns={milkCollectionColumns.map(column => {
                    if (column.id === 'actions') {
                      return {
                        ...column,
                        cell: ({ row }) => <CellAction data={row.original} onRefresh={fetchMilkCollections} />
                      };
                    }
                    return column;
                  })}
                  data={milkCollectionData}
                  enableColumnSelection={false}
                  enableRowNumbering={true}
                  showSearchBar={true}
                  currentPage={milkCollectionPage}
                  totalPages={milkCollectionTotalPages}
                  totalItems={milkCollectionTotalItems}
                  onPageChange={(newPage) => setMilkCollectionPage(newPage)}
                  onSearchChange={(term) => setMilkCollectionSearchTerm(term)}
                  containerClassName="w-full border rounded-md shadow-sm max-w-[77vw]"
                />
              </div>
            </Card>
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-start gap-4">
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-2xl font-bold">Equipos</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">Lista de equipos en esta granja</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <DataTable<Equipment>
                  columns={getEquipmentColumns(() => fetchEquipment()).filter(col => col.id !== 'actions')}
                  data={equipmentData}
                  enableColumnSelection={false}
                  enableRowNumbering={true}
                  showSearchBar={true}
                  filters={["type"]}
                  filterOptions={{type: ["Tanque de leche", "Estación de lavado"]}}
                  onFilterChange={(filters) => setSelectedEquipmentFilters(filters)}
                  currentPage={equipmentPage}
                  totalPages={equipmentTotalPages}
                  totalItems={equipmentTotalItems}
                  onPageChange={(newPage) => setEquipmentPage(newPage)}
                  onSearchChange={(term) => setEquipmentSearchTerm(term)}
                  containerClassName="w-full border rounded-md shadow-sm max-w-[77vw]"
                />
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Statistics farmData={farmData} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-11"></div>
      <MilkCollectionAddModal 
        isOpen={showAddMilkCollectionModal} 
        onClose={() => setShowAddMilkCollectionModal(false)} 
        farmId={farmData._id}
        onRefresh={fetchMilkCollections} 
      />
    </PageContainer>
  )
}