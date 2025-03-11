'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { devicesColors } from '@/constants/data';

interface Device {
  _id: string;
  boardId: string;
  type: string;
}

interface AssociatedTank {
  _id: string;
  name: string;
}

interface EquipmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  equipmentId: string;
  onRefresh: () => void;
}

const EquipmentEditModal: React.FC<EquipmentEditModalProps> = ({ 
  isOpen, 
  onClose, 
  farmId, 
  equipmentId,
  onRefresh 
}) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // Estados básicos
  const [loading, setLoading] = useState(true);
  
  const [equipmentInfo, setEquipmentInfo] = useState<{
    name: string;
    type: string;
    farm: string;
    description?: string;
  }>({
    name: '',
    type: '',
    farm: farmId,
    description: '',
  });
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [associatedTanks, setAssociatedTanks] = useState<AssociatedTank[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Record<string, boolean>>({});
  const [selectedTanks, setSelectedTanks] = useState<Record<string, boolean>>({});

  // Estados para paginación y búsqueda
  const [devicesPage, setDevicesPage] = useState(1);
  const [devicesSearchTerm, setDevicesSearchTerm] = useState('');
  const [devicesTotalItems, setDevicesTotalItems] = useState(0);
  const [devicesTotalPages, setDevicesTotalPages] = useState(1);
  
  const [tanksPage, setTanksPage] = useState(1);
  const [tanksSearchTerm, setTanksSearchTerm] = useState('');
  const [tanksTotalItems, setTanksTotalItems] = useState(0);
  const [tanksTotalPages, setTanksTotalPages] = useState(1);
  
  // Estado para filtros
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: [],
  });

  // Obtener los tipos de dispositivos según el tipo de equipo
  const getDeviceTypesByEquipmentType = (equipmentType: string) => {
    switch (equipmentType) {
      case "Tanque de leche":
        return ["Monitor de leche", "Monitor de tanque"];
      case "Estación de lavado":
        return ["Monitor de estación de lavado"];
      default:
        return ["Monitor de leche", "Monitor de tanque", "Monitor de estación de lavado"];
    }
  };

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && equipmentId) {
      const fetchEquipmentData = async () => {
        if (!session?.accessToken) {
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          onClose();
          return;
        }
        
        setLoading(true);
        try {
          // 1. Obtener datos del equipo
          const response = await fetch(`http://localhost:5001/equipment/${equipmentId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener datos del equipamiento');
          }
          
          const equipmentData = await response.json();
          console.log("Datos del equipamiento:", equipmentData);
          
          // 2. Actualizar estado con los datos del equipo
          setEquipmentInfo({
            name: equipmentData.name || '',
            type: equipmentData.type || '',
            farm: equipmentData.farm || farmId,
            description: equipmentData.description || '',
          });
          
          // 3. Establecer filtros basados en el tipo de equipo
          const deviceTypes = getDeviceTypesByEquipmentType(equipmentData.type);
          setSelectedFilters({ type: deviceTypes });
          
          // 4. Preparar selección de dispositivos
          if (Array.isArray(equipmentData.devices)) {
            const deviceSelection: Record<string, boolean> = {};
            equipmentData.devices.forEach((deviceId: string) => {
              deviceSelection[deviceId] = true;
            });
            setSelectedDevices(deviceSelection);
          }
          
          // 5. Preparar selección de tanques si es estación de lavado
          if (equipmentData.type === "Estación de lavado" && Array.isArray(equipmentData.associatedTanks)) {
            const tankSelection: Record<string, boolean> = {};
            equipmentData.associatedTanks.forEach((tankId: string) => {
              tankSelection[tankId] = true;
            });
            setSelectedTanks(tankSelection);
          }
          
          // 6. Cargar datos de dispositivos
          await fetchDevicesData(equipmentData.farm || farmId, deviceTypes);
          
          // 7. Cargar datos de tanques si es necesario
          if (equipmentData.type === "Estación de lavado") {
            await fetchTanksData(equipmentData.farm || farmId);
          }
        } catch (error) {
          console.error('Error al obtener datos del equipamiento:', error);
          toast({
            title: "Error al cargar el equipamiento",
            description: error instanceof Error ? error.message : "Error desconocido",
            variant: "destructive",
          });
          onClose();
        } finally {
          setLoading(false);
        }
      };
      
      fetchEquipmentData();
    }
  }, [isOpen, equipmentId, session, farmId]);

  // Función para cargar dispositivos
  const fetchDevicesData = async (farmId: string, deviceTypes: string[] = []) => {
    if (!session?.accessToken) return;
    
    try {
      const typesQuery = deviceTypes.length > 0 ? deviceTypes.join(',') : '';
      const filtersQuery = JSON.stringify({ type: deviceTypes });
      
      const searchParams = new URLSearchParams();
      searchParams.append('farmId', farmId);
      searchParams.append('page', '1');
      searchParams.append('limit', '10');
      searchParams.append('types', typesQuery);
      searchParams.append('filters', encodeURIComponent(filtersQuery));

      const response = await fetch(
        `http://localhost:5001/device/list?${searchParams.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener dispositivos');
      }
      
      const result = await response.json();
      
      if (Array.isArray(result.data)) {
        setDevices(result.data);
        setDevicesTotalItems(result.totalItems || result.data.length);
        setDevicesTotalPages(result.totalPages || Math.ceil(result.data.length / 10));
      }
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      toast({
        title: "Error al cargar dispositivos",
        description: error instanceof Error ? error.message : "Error al obtener dispositivos",
        variant: "destructive",
      });
    }
  };

  // Función para cargar tanques
  const fetchTanksData = async (farmId: string) => {
    if (!session?.accessToken) return;
    
    try {
      console.log("Obteniendo tanques para farmId:", farmId);
      
      const response = await fetch(
        `http://localhost:5001/equipment/listTanks?farmId=${farmId}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error al obtener tanques: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Respuesta API tanques:", result);
      
      // El endpoint devuelve directamente un array de tanques
      if (Array.isArray(result)) {
        setAssociatedTanks(result);
        setTanksTotalItems(result.length);
        setTanksTotalPages(Math.ceil(result.length / 10));
      } else {
        console.warn('Formato de respuesta de tanques inesperado:', result);
        setAssociatedTanks([]);
        setTanksTotalItems(0);
        setTanksTotalPages(1);
      }
    } catch (error) {
      console.error('Error al obtener tanques:', error);
      toast({
        title: "Error al cargar tanques",
        description: error instanceof Error ? error.message : "Error al obtener tanques",
        variant: "destructive",
      });
      setAssociatedTanks([]);
      setTanksTotalItems(0);
      setTanksTotalPages(1);
    }
  };

  // Columnas para la tabla de dispositivos
  const deviceColumns = [
    {
      id: "boardId",
      header: "ID del Dispositivo",
      accessorKey: "boardId",
    },
    {
      id: "type",
      header: "Tipo de Dispositivo",
      accessorKey: "type",
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue() as string;
        const backgroundColor = devicesColors[value] || "#6b7280"; // Default to gray-500
        return (
          <Badge 
            className="max-w-[220px] h-6 flex items-center justify-center text-xs truncate px-2" 
            style={{ backgroundColor, color: 'white' }}
          >
            {value}
          </Badge>
        );
      },
    },
  ];

  // Columnas para la tabla de tanques asociados
  const tankColumns = [
    {
      id: "name",
      header: "Nombre del Tanque",
      accessorKey: "name",
    }
  ];

  const deviceTypeFilterOptions = {
    type: equipmentInfo.type ? getDeviceTypesByEquipmentType(equipmentInfo.type) : [],
  };

  // Función para cambiar el tipo de equipo
  const handleTypeChange = (value: string) => {
    setEquipmentInfo({ ...equipmentInfo, type: value });
    // Actualizar filtros basados en el tipo de equipo
    const deviceTypes = getDeviceTypesByEquipmentType(value);
    setSelectedFilters({ type: deviceTypes });
    // Refrescar dispositivos con nuevos filtros
    fetchDevicesData(equipmentInfo.farm, deviceTypes);
    // Limpiar selección de dispositivos
    setSelectedDevices({});
    // Limpiar selección de tanques si no es estación de lavado
    if (value !== "Estación de lavado") {
      setSelectedTanks({});
    } else {
      // Cargar tanques si es estación de lavado
      fetchTanksData(equipmentInfo.farm);
    }
  };

  // Funciones para manejar cambios en la paginación y búsqueda
  const handleDevicesPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= devicesTotalPages) {
      setDevicesPage(newPage);
      handleDevicesLoadMore(newPage);
    }
  };

  const handleDevicesLoadMore = async (page: number) => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    try {
      const typesQuery = selectedFilters['type'] ? selectedFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      
      const searchParams = new URLSearchParams();
      searchParams.append('farmId', equipmentInfo.farm);
      searchParams.append('page', page.toString());
      searchParams.append('limit', '10');
      searchParams.append('types', typesQuery);
      searchParams.append('filters', encodeURIComponent(filtersQuery));
      if (devicesSearchTerm) {
        searchParams.append('searchTerm', devicesSearchTerm);
      }

      const response = await fetch(
        `http://localhost:5001/device/list?${searchParams.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener dispositivos');
      }
      
      const result = await response.json();
      
      if (Array.isArray(result.data)) {
        setDevices(result.data);
      }
    } catch (error) {
      console.error('Error al cargar más dispositivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevicesSearchChange = (term: string) => {
    setDevicesSearchTerm(term);
    setDevicesPage(1);
    handleDevicesSearch(term);
  };

  const handleDevicesSearch = async (term: string) => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    try {
      const typesQuery = selectedFilters['type'] ? selectedFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      
      const searchParams = new URLSearchParams();
      searchParams.append('farmId', equipmentInfo.farm);
      searchParams.append('page', '1');
      searchParams.append('limit', '10');
      searchParams.append('types', typesQuery);
      searchParams.append('filters', encodeURIComponent(filtersQuery));
      if (term) {
        searchParams.append('searchTerm', term);
      }

      const response = await fetch(
        `http://localhost:5001/device/list?${searchParams.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al buscar dispositivos');
      }
      
      const result = await response.json();
      
      if (Array.isArray(result.data)) {
        setDevices(result.data);
        setDevicesTotalItems(result.totalItems || result.data.length);
        setDevicesTotalPages(result.totalPages || Math.ceil(result.data.length / 10));
      }
    } catch (error) {
      console.error('Error al buscar dispositivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTanksPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= tanksTotalPages) {
      setTanksPage(newPage);
      handleTanksLoadMore(newPage);
    }
  };

  const handleTanksLoadMore = async (page: number) => {
    if (!session?.accessToken || equipmentInfo.type !== "Estación de lavado") return;
    
    setLoading(true);
    try {
      console.log("Cargando más tanques, página:", page);
      
      const response = await fetch(
        `http://localhost:5001/equipment/listTanks?farmId=${equipmentInfo.farm}&page=${page}&limit=10${tanksSearchTerm ? `&searchTerm=${tanksSearchTerm}` : ''}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error al obtener tanques: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Respuesta paginación tanques:", result);
      
      // El endpoint devuelve directamente un array
      if (Array.isArray(result)) {
        setAssociatedTanks(result);
      } else {
        console.warn('Formato de respuesta de tanques inesperado:', result);
        setAssociatedTanks([]);
      }
    } catch (error) {
      console.error('Error al cargar más tanques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTanksSearchChange = (term: string) => {
    setTanksSearchTerm(term);
    setTanksPage(1);
    handleTanksSearch(term);
  };

  const handleTanksSearch = async (term: string) => {
    if (!session?.accessToken || equipmentInfo.type !== "Estación de lavado") return;
    
    setLoading(true);
    try {
      console.log("Buscando tanques con término:", term);
      
      const response = await fetch(
        `http://localhost:5001/equipment/listTanks?farmId=${equipmentInfo.farm}&searchTerm=${term}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error al buscar tanques: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Respuesta búsqueda tanques:", result);
      
      // El endpoint devuelve directamente un array
      if (Array.isArray(result)) {
        setAssociatedTanks(result);
        setTanksTotalItems(result.length);
        setTanksTotalPages(Math.ceil(result.length / 10));
      } else {
        console.warn('Formato de respuesta de tanques inesperado:', result);
        setAssociatedTanks([]);
        setTanksTotalItems(0);
        setTanksTotalPages(1);
      }
    } catch (error) {
      console.error('Error al buscar tanques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
    setDevicesPage(1);
    const deviceTypes = filters['type'] || [];
    fetchDevicesData(equipmentInfo.farm, deviceTypes);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEquipmentInfo({ ...equipmentInfo, [e.target.id]: e.target.value });
  };

  const handleDeviceSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedDevices(selectedRowIds);
  };

  const handleTankSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedTanks(selectedRowIds);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!session?.accessToken) {
      toast({
        title: "Error",
        description: "No hay sesión iniciada",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const selectedDeviceIds = Object.entries(selectedDevices)
        .filter(([_, isSelected]) => isSelected)
        .map(([deviceId, _]) => deviceId);
        
      const selectedTankIds = Object.entries(selectedTanks)
        .filter(([_, isSelected]) => isSelected)
        .map(([tankId, _]) => tankId);
      
      // PUT request para actualizar el equipamiento
      const response = await fetch(`http://localhost:5001/equipment/${equipmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
        body: JSON.stringify({
          ...equipmentInfo,
          devices: selectedDeviceIds,
          associatedTanks: equipmentInfo.type === "Estación de lavado" ? selectedTankIds : [],
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al actualizar el equipamiento');
      }
      
      toast({
        description: "Equipo actualizado con éxito",
        variant: "success",
      });
      handleClose();
      onRefresh();
    } catch (error) {
      console.error('Error al actualizar el equipamiento:', error);
      toast({
        title: "Error al actualizar el equipamiento",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = 
    equipmentInfo.name.trim() !== '' && 
    equipmentInfo.type !== '';

  // Renderizar un indicador de carga mientras los datos se están cargando
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
            <DialogTitle className="text-lg font-bold">Editar equipamiento</DialogTitle>
          </div>
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Renderizar el formulario cuando los datos están cargados
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Editar equipamiento</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Datos del equipamiento</CardTitle>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        value={equipmentInfo.name} 
                        onChange={handleInputChange} 
                        placeholder="Nombre del equipamiento" 
                        className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                      <Select value={equipmentInfo.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tanque de leche">Tanque de leche</SelectItem>
                          <SelectItem value="Estación de lavado">Estación de lavado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <textarea 
                      id="description" 
                      value={equipmentInfo.description || ""} 
                      onChange={handleInputChange} 
                      placeholder="Ingrese una descripción" 
                      className="bg-white dark:bg-gray-800 text-black dark:text-white w-full h-32 p-2 rounded-md resize-none text-sm" 
                    />
                  </div>
                  
                  {equipmentInfo.type && (
                    <>
                      <Separator />
                      <div>
                        <CardTitle className="mb-4">Dispositivos asociados</CardTitle>
                      </div>
                      <div className="overflow-hidden">
                        <div className="w-full overflow-x-auto pb-2 -mx-4 sm:mx-0">
                          <div className="min-w-full px-4 sm:px-0">
                            <DataTable<Device>
                              columns={deviceColumns}
                              data={devices}
                              enableColumnSelection={true}
                              rowSelection={selectedDevices}
                              onRowSelectionChange={handleDeviceSelectionChange}
                              onPageChange={handleDevicesPageChange}
                              onSearchChange={handleDevicesSearchChange}
                              currentPage={devicesPage}
                              totalPages={devicesTotalPages}
                              limit={10}
                              totalItems={devicesTotalItems} 
                              containerClassName="w-full border rounded-md shadow-sm max-w-[90vw]"
                              showSearchBar={true}
                              filters={["type"]}
                              filterOptions={deviceTypeFilterOptions}
                              onFilterChange={handleFilterChange}
                              loading={loading}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {equipmentInfo.type === "Estación de lavado" && (
                    <>
                      <Separator />
                      <div>
                        <CardTitle className="mb-4">Tanques asociados</CardTitle>
                        <p className="text-sm text-gray-500 mb-4">Seleccione los tanques que serán limpiados por esta estación de lavado</p>
                      </div>
                      <div className="overflow-hidden">
                        <div className="w-full overflow-x-auto pb-2 -mx-4 sm:mx-0">
                          <div className="min-w-full px-4 sm:px-0">
                            <DataTable<AssociatedTank>
                              columns={tankColumns}
                              data={associatedTanks}
                              enableColumnSelection={true}
                              rowSelection={selectedTanks}
                              onRowSelectionChange={handleTankSelectionChange}
                              onPageChange={handleTanksPageChange}
                              onSearchChange={handleTanksSearchChange}
                              currentPage={tanksPage}
                              totalPages={tanksTotalPages}
                              limit={10}
                              totalItems={tanksTotalItems} 
                              containerClassName="w-full border rounded-md shadow-sm"
                              showSearchBar={true}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Button 
                    id="submit-equipment-button" 
                    type="submit" 
                    disabled={!isFormValid}
                  >
                    Guardar cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default EquipmentEditModal;