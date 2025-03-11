'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface EquipmentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  onRefresh: () => void;
}

const EquipmentAddModal: React.FC<EquipmentAddModalProps> = ({ 
  isOpen, 
  onClose, 
  farmId, 
  onRefresh 
}) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [equipmentInfo, setEquipmentInfo] = useState({
    name: '',
    type: '',
    farm: farmId,
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

  // Reset state on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      mountedRef.current = true;
      setInitialLoading(true);
      setEquipmentInfo({
        name: '',
        type: '',
        farm: farmId,
      });
      setSelectedDevices({});
      setSelectedTanks({});
      setDevicesPage(1);
      setTanksPage(1);
      setDevicesSearchTerm('');
      setTanksSearchTerm('');
      
      // Initialize data when opening modal
      initData();
    }
  }, [isOpen, farmId]);

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

  const handleTypeChange = (value: string) => {
    setEquipmentInfo({ ...equipmentInfo, type: value });
    // Actualizar filtros basados en el tipo de equipo
    const deviceTypes = getDeviceTypesByEquipmentType(value);
    setSelectedFilters({ type: deviceTypes });
    // Clear devices and reset pagination to force a fresh fetch
    setDevices([]);
    setDevicesPage(1);
    // Limpiar selección de tanques asociados si no es estación de lavado
    if (value !== "Estación de lavado") {
      setSelectedTanks({});
    }
    // Clear selected devices when type changes
    setSelectedDevices({});
  };

  // Asegurar que los filtros se establecen correctamente al cambiar el tipo
  useEffect(() => {
    if (isOpen) {
      const deviceTypes = getDeviceTypesByEquipmentType(equipmentInfo.type);
      setSelectedFilters({ type: deviceTypes });
    }
  }, [isOpen, equipmentInfo.type]);

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

  const deviceTypeFilterOptions = {
    type: getDeviceTypesByEquipmentType(equipmentInfo.type),
  };

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: [...deviceTypeFilterOptions.type],
  });

  // Evitar re-renderizados innecesarios al manejar los filtros
  const handleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
    setDevicesPage(1);
  }, []);

  // Columnas para la tabla de tanques asociados
  const tankColumns = [
    {
      id: "name",
      header: "Nombre del Tanque",
      accessorKey: "name",
    }
  ];

  // Modificar el fetchDevices para que coincida con el patrón de page.tsx
  const fetchDevices = useCallback(async (farmId: string, page: number = 1, searchTerm: string = '') => {
    if (!session?.accessToken || !farmId || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      const typesQuery = selectedFilters['type'] ? selectedFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      const searchParams = new URLSearchParams();
      searchParams.append('farmId', farmId);
      searchParams.append('page', page.toString());
      searchParams.append('limit', '10');
      searchParams.append('types', typesQuery);
      searchParams.append('filters', encodeURIComponent(filtersQuery));
      if (searchTerm) {
        searchParams.append('searchTerm', searchTerm);
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
      
      if (!mountedRef.current) return;
      
      if (!response.ok) {
        throw new Error('Error al obtener dispositivos');
      }
      
      const result = await response.json();
      
      if (!mountedRef.current) return;
      
      if (Array.isArray(result.data)) {
        setDevices(result.data);
        setDevicesTotalItems(result.totalItems || result.data.length);
        setDevicesTotalPages(result.totalPages || Math.ceil(result.data.length / 10));
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al obtener dispositivos:', error);
      toast({
        title: "Error al cargar dispositivos",
        description: error instanceof Error ? error.message : "Error al obtener dispositivos",
        variant: "destructive",
      });
    } finally {
      if (mountedRef.current) {
        isFetchingRef.current = false;
      }
    }
  }, [session, selectedFilters, toast]);

  // Asegurar que los datos no se borren al cambiar filtros o paginación
  useEffect(() => {
    if (isOpen && farmId) {
      fetchDevices(farmId, devicesPage, devicesSearchTerm);
    }
  }, [devicesPage, devicesSearchTerm, isOpen, farmId, fetchDevices]);

  // Optimized fetchTanks to avoid race conditions
  const fetchTanks = useCallback(async (page: number = 1, searchTerm: string = '') => {
    if (!session?.accessToken || !farmId || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);

      const searchParams = new URLSearchParams();
      searchParams.append('farmId', farmId);
      searchParams.append('page', page.toString());
      searchParams.append('limit', '10');
      if (searchTerm) {
        searchParams.append('searchTerm', searchTerm);
      }
      
      const response = await fetch(
        `http://localhost:5001/equipment/listTanks?${searchParams.toString()}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        }
      );
      
      if (!mountedRef.current) return;
      
      if (!response.ok) {
        throw new Error('Error al obtener tanques');
      }
      
      const result = await response.json();
      
      if (!mountedRef.current) return;
      
      if (Array.isArray(result)) {
        setAssociatedTanks(result);
        setTanksTotalItems(result.length);
        setTanksTotalPages(Math.ceil(result.length / 10));
      } else if (result && typeof result === 'object' && result.data) {
        setAssociatedTanks(result.data);
        setTanksTotalItems(result.totalItems || result.data.length);
        setTanksTotalPages(result.totalPages || Math.ceil(result.data.length / 10));
      } else {
        setAssociatedTanks([]);
        setTanksTotalItems(0);
        setTanksTotalPages(1);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al obtener tanques:', error);
      toast({
        title: "Error al cargar tanques",
        description: error instanceof Error ? error.message : "Error al obtener tanques",
        variant: "destructive",
      });
      setAssociatedTanks([]);
      setTanksTotalItems(0);
      setTanksTotalPages(1);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [session, farmId, toast]);

  // Inicializar carga de datos cuando se abre el modal
  const initData = useCallback(async () => {
    if (!isOpen || !farmId || !session?.accessToken || !mountedRef.current) {
      return;
    }
    
    try {
      setInitialLoading(true);
      
      // Cargar dispositivos y tanques en paralelo
      await Promise.all([
        fetchDevices(farmId, 1, devicesSearchTerm),
        fetchTanks(1, tanksSearchTerm)
      ]);
      
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("Error al cargar datos iniciales:", error);
    } finally {
      if (mountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, [isOpen, farmId, session, fetchDevices, fetchTanks, devicesSearchTerm, tanksSearchTerm]);

  // Manejar cambios de paginación y búsqueda para dispositivos con useCallback para evitar re-renderizados innecesarios
  const handleDevicesPageChange = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= devicesTotalPages) {
      setDevicesPage(newPage);
    }
  }, [devicesTotalPages]);

  const handleDevicesSearchChange = useCallback((term: string) => {
    setDevicesSearchTerm(term);
    setDevicesPage(1);
  }, []);

  const handleTanksPageChange = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= tanksTotalPages) {
      setTanksPage(newPage);
    }
  }, [tanksTotalPages]);

  const handleTanksSearchChange = useCallback((term: string) => {
    setTanksSearchTerm(term);
    setTanksPage(1);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    // Resetear estados
    setDevicesTotalItems(0);
    setDevicesTotalPages(1);
    setDevices([]);
    setSelectedDevices({});
    setSelectedTanks({});
    setDevicesPage(1);
    setTanksPage(1);
    setDevicesSearchTerm('');
    setTanksSearchTerm('');
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
      
      const response = await fetch(`http://localhost:5001/equipment`, {
        method: 'POST',
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
      
      if (!mountedRef.current) return;
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear el equipamiento');
      }
      
      toast({
        description: "Equipo creado con éxito",
        variant: "success",
      });
      handleClose();
      onRefresh();
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al crear el equipamiento:', error);
      toast({
        title: "Error al crear el equipamiento",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const isFormValid = 
    equipmentInfo.name.trim() !== '' && 
    equipmentInfo.type !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Crear nuevo equipamiento</DialogTitle>
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
                        disabled={loading}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                      <Select value={equipmentInfo.type} onValueChange={handleTypeChange} disabled={loading}>
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
                              key={`device-table-${equipmentInfo.type}`}
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
                    disabled={!isFormValid || loading}
                  >
                    {loading ? "Creando..." : "Crear equipamiento"}
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

export default EquipmentAddModal;