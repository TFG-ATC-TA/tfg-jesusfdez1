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
import { User, MilkCollection, Equipment } from '@/types'
import { useEffect, useState, useCallback, useRef } from 'react';
import { columnsAlternative } from '@/components/tables/user-tables/columns';
import { columns as milkCollectionColumns } from '@/components/tables/milk-collection-tables/columns';
import { columns as equipmentColumns } from '@/components/tables/equipment-tables/columns';
import TemperatureProbeChart from '@/components/charts/temperature-gyroscope-chart';
import { CalendarDateRangePicker, DateRange } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PaperPlaneIcon } from "@radix-ui/react-icons"
import DairyTimeline from "@/components/charts/dairy-timeline-chart"
import MilkCollectionAddModal from "@/components/modals/milk-collection-add-modal"
import { CellAction } from "@/components/tables/milk-collection-tables/cell-action"
import TicketAddModal from "@/components/modals/ticket-add-modal"
import EquipmentAddModal from "@/components/modals/equipment-add-modal"

interface AdminViewProps {
  farmData: any;
}

export default function AdminView({ farmData }: AdminViewProps) {
  const { data: session } = useSession()
  // Users state
  const [userData, setUserData] = useState<User[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userTotalItems, setUserTotalItems] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  
  // Milk collections state
  const [milkCollectionData, setMilkCollectionData] = useState<MilkCollection[]>([]);
  const [showAddMilkCollectionModal, setShowAddMilkCollectionModal] = useState(false);
  const [milkCollectionPage, setMilkCollectionPage] = useState(1);
  const [milkCollectionSearchTerm, setMilkCollectionSearchTerm] = useState('');
  const [milkCollectionTotalItems, setMilkCollectionTotalItems] = useState(0);
  const [milkCollectionTotalPages, setMilkCollectionTotalPages] = useState(1);
  
  // Equipment state
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [equipmentTotalItems, setEquipmentTotalItems] = useState(0);
  const [equipmentTotalPages, setEquipmentTotalPages] = useState(1);

  // Common state
  const [activeTab, setActiveTab] = useState("overview");
  const initialDateRange = { from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date(new Date().setHours(23, 59, 59, 999))};
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(initialDateRange);
  const isFetchingRef = useRef<string | false>(false);

  const filterOptions = {
    role: ["Administrador", "Veterinario", "Industria", "Ganadero"],
  };

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    role: [...filterOptions.role],
  });

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }

    // Solo bloquear fetches paralelos para la misma función
    if (isFetchingRef.current === 'users') return;
    
    try {
      isFetchingRef.current = 'users';
      const rolesQuery = selectedFilters['role'] ? selectedFilters['role'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      const response = await fetch(`http://localhost:5001/user/list?farmId=${farmData._id}&page=${userPage}&limit=10&searchTerm=${userSearchTerm}&roles=${rolesQuery}&filters=${encodeURIComponent(filtersQuery)}`, {
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
      setUserData(result.data);
      setUserTotalItems(result.totalItems);
      setUserTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [session, farmData._id, userPage, userSearchTerm, selectedFilters]);

  // Fetch milk collections data
  const fetchMilkCollections = useCallback(async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }

    // Solo bloquear fetches paralelos para la misma función
    if (isFetchingRef.current === 'collections') return;
    
    try {
      isFetchingRef.current = 'collections';
      const response = await fetch(`http://localhost:5001/collection/list?farmId=${farmData._id}&page=${milkCollectionPage}&limit=10&searchTerm=${milkCollectionSearchTerm}`, {
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

    // Solo bloquear fetches paralelos para la misma función
    if (isFetchingRef.current === 'equipment') return;
    
    try {
      isFetchingRef.current = 'equipment';
      const response = await fetch(`http://localhost:5001/equipment/list?farmId=${farmData._id}&page=${equipmentPage}&limit=10&searchTerm=${equipmentSearchTerm}`, {
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
  }, [session, farmData._id, equipmentPage, equipmentSearchTerm]);

  // Effect to fetch users data
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, userPage, userSearchTerm, selectedFilters]);

  // Effect to fetch milk collections data
  useEffect(() => {
    fetchMilkCollections();
  }, [fetchMilkCollections, milkCollectionPage, milkCollectionSearchTerm]);

  // Effect to fetch equipment data
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment, equipmentPage, equipmentSearchTerm]);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    setAppliedDateRange(dateRange);
  };

  const handleOpenAddEquipmentModal = () => {
    setShowAddEquipmentModal(true);
  };

  const handleCloseAddEquipmentModal = () => {
    setShowAddEquipmentModal(false);
  };

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
        
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview">Vista general</TabsTrigger>
              <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
            </TabsList>
            {activeTab === "analytics" && (
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="flex-grow">
                  <CalendarDateRangePicker
                    start={dateRange?.from}
                    end={dateRange?.to}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </div>
                <Button 
                  variant="default" 
                  size="default"
                  onClick={handleApplyDateRange}
                  className="h-9 shrink-0"
                >
                  <PaperPlaneIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <TabsContent value="overview" className="space-y-4">
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between items-start gap-4">
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-2xl font-bold">Usuarios con acceso</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">Lista de los usuarios que tienen acceso en esta granja</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <DataTable<User>
                  columns={columnsAlternative}
                  data={userData}
                  enableColumnSelection={false}
                  enableRowNumbering={true}
                  showSearchBar={true}
                  filters={["role"]}
                  filterOptions={filterOptions}
                  currentPage={userPage}
                  totalPages={userTotalPages}
                  onPageChange={(newPage) => setUserPage(newPage)}
                  onSearchChange={(term) => setUserSearchTerm(term)}
                  onFilterChange={handleFilterChange}
                  containerClassName="w-full border rounded-md shadow-sm max-w-[77vw]"
                />
              </div>
            </Card>
            
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
                <Button
                  className="text-xs md:text-sm flex items-center justify-center shrink-0"
                  onClick={handleOpenAddEquipmentModal}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2 hidden md:inline">Añadir equipo</span>
                </Button>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <DataTable<Equipment>
                  columns={equipmentColumns}
                  data={equipmentData}
                  enableColumnSelection={false}
                  enableRowNumbering={true}
                  showSearchBar={true}
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
            <div className="col-span-2 grid grid-cols-1 gap-4 mb-5">
              <TemperatureProbeChart 
                key={`${appliedDateRange?.from}-${appliedDateRange?.to}`} 
                bucket={farmData.idname} 
                startDate={appliedDateRange?.from} 
                endDate={appliedDateRange?.to} 
              />
              <DairyTimeline/>
            </div>
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

      <TicketAddModal 
        isOpen={false} 
        onClose={() => console.log('TicketAddModal closed')} 
        onRefresh={() => console.log('TicketAddModal refreshed')} 
      />

      <EquipmentAddModal 
        isOpen={showAddEquipmentModal} 
        onClose={handleCloseAddEquipmentModal} 
        farmId={farmData._id}
        onRefresh={fetchEquipment}
      />
    </PageContainer>
  )
}