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
import { User } from '@/types'
import { useEffect, useState, useCallback, useRef } from 'react';
import { columnsAlternative } from '@/components/tables/user-tables/columns';
import UserAddModal from '@/components/modals/user-add-modal';
import TemperatureProbeChart from '@/components/charts/temperature-gyroscope';
import { CalendarDateRangePicker, DateRange } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { PaperPlaneIcon } from "@radix-ui/react-icons"

interface AdminViewProps {
  farmData: any;
}

export default function AdminView({ farmData }: AdminViewProps) {
  const { data: session } = useSession()
  const [data, setData] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const initialDateRange = { from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date(new Date().setHours(23, 59, 59, 999))};
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingRef = useRef(false);

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
      const response = await fetch(`http://localhost:5001/user/list?farmId=${farmData._id}&page=${page}&limit=10&searchTerm=${searchTerm}&roles=${rolesQuery}&filters=${encodeURIComponent(filtersQuery)}`, {
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
  }, [session, farmData._id, page, searchTerm, selectedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, page, searchTerm, selectedFilters]);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleApplyDateRange = () => {
    setAppliedDateRange(dateRange);
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
            <CardHeader className="flex flex-col md:flex-row justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Usuarios con acceso</CardTitle>
                <CardDescription>Lista de los usuarios que tienen acceso en esta granja</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-4 px-6 pb-6">
            <DataTable<User>
              columns={columnsAlternative}
              data={data}
              enableColumnSelection={false}
              enableRowNumbering={true}
              showSearchBar={true}
              filters={["role"]}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onSearchChange={(term) => setSearchTerm(term)}
              onFilterChange={handleFilterChange}
              containerClassName="w-full border rounded-md shadow-sm max-w-[77vw]"
            />
          </div>
          <UserAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onRefresh={fetchUsers} />
        </Card>
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="col-span-2 grid grid-cols-1 gap-4 mb-5">
                  <TemperatureProbeChart 
                    key={`${appliedDateRange?.from}-${appliedDateRange?.to}`} 
                    bucket={farmData.idname} 
                    startDate={appliedDateRange?.from} 
                    endDate={appliedDateRange?.to} 
                  />

                  
              </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-11"></div>
    </PageContainer>
  )
}