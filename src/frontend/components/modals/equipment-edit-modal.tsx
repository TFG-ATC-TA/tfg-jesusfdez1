/**
 * Modal para editar equipamiento existente en el sistema
 * Permite modificar equipos con tipos específicos y reasignación de dispositivos y tanques
 * Incluye validaciones de compatibilidad y gestión de recursos
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Device, AssociatedTank } from '@/types';

/**
 * Props del modal de editar equipamiento
 */
interface EquipmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  onRefresh: () => void;
}

/**
 * Componente modal para editar equipamiento existente
 * Gestiona la modificación de equipos con reasignación de dispositivos y tanques compatibles
 */
const EquipmentEditModal: React.FC<EquipmentEditModalProps> = ({ 
  isOpen, 
  onClose, 
  equipmentId,
  onRefresh 
}) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  // Referencias para control de montaje y fetching
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Estado para la información del equipamiento
  const [equipmentInfo, setEquipmentInfo] = useState({
    name: '',
    type: '',
    farm: '',
    description: ''
  });
  
  // Estados para gestión de dispositivos y tanques
  const [devices, setDevices] = useState<Device[]>([]);
  const [associatedTanks, setAssociatedTanks] = useState<AssociatedTank[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Record<string, boolean>>({});
  const [selectedTanks, setSelectedTanks] = useState<Record<string, boolean>>({});

  // Estados para paginación y búsqueda de dispositivos
  const [devicesPage, setDevicesPage] = useState(1);
  const [devicesSearchTerm, setDevicesSearchTerm] = useState('');
  const [devicesTotalItems, setDevicesTotalItems] = useState(0);
  const [devicesTotalPages, setDevicesTotalPages] = useState(1);
  
  // Estados para paginación y búsqueda de tanques
  const [tanksPage, setTanksPage] = useState(1);
  const [tanksSearchTerm, setTanksSearchTerm] = useState('');
  const [tanksTotalItems, setTanksTotalItems] = useState(0);
  const [tanksTotalPages, setTanksTotalPages] = useState(1);

  /**
   * Reset state on unmount to avoid memory leaks
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Helper to get device types based on equipment type
   * @param equipmentType - Tipo de equipamiento seleccionado
   * @returns Array de tipos de dispositivos compatibles
   */
  function getDeviceTypesByEquipmentType(equipmentType: string): string[] {
    switch (equipmentType) {
      case "Tanque de leche":
        return ["Monitor de leche", "Monitor de tanque"];
      case "Estación de lavado":
        return ["Monitor de estación de lavado"];
      default:
        return ["Monitor de leche", "Monitor de tanque", "Monitor de estación de lavado"];
    }
  }

  // Mover deviceTypeFilterOptions fuera del render para evitar recálculos
  // Optimiza el rendimiento evitando recálculos innecesarios
  const deviceTypeFilterOptions = useMemo(() => ({
    type: getDeviceTypesByEquipmentType(equipmentInfo.type),
  }), [equipmentInfo.type]);
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: getDeviceTypesByEquipmentType(equipmentInfo.type),
  });

  // Define fetchDevicesAndMark and fetchTanksAndMark first to avoid circular references  // Optimized fetchDevices para marcar los dispositivos seleccionados
  const fetchDevicesAndMark = useCallback(async (farmId: string, page = 1, searchTerm = '') => {
    if (!session?.accessToken || !farmId || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      const typesQuery = selectedFilters['type'] ? selectedFilters['type'].join(',') : '';
      const filtersQuery = JSON.stringify(selectedFilters);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/device/list?page=${page}&limit=10&searchTerm=${searchTerm}&types=${typesQuery}&filters=${encodeURIComponent(filtersQuery)}&farmId=${farmId}`, 
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
      
      console.log("Dispositivos obtenidos:", result.data);
      
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

  // Optimized fetchTanks para marcar los tanques seleccionados
  const fetchTanksAndMark = useCallback(async (farmId: string, page = 1, searchTerm = '') => {
    if (!session?.accessToken || !farmId || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/equipment/listTanks?page=${page}&limit=10&searchTerm=${searchTerm}&farmId=${farmId}`, 
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
      
      console.log("Tanques obtenidos:", result);
      
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
  }, [session, toast]);
  // Inicializar carga de datos cuando se abre el modal
  const initData = useCallback(async (farmId: string) => {
    if (!isOpen || !farmId || !session?.accessToken || !mountedRef.current) {
      return;
    }
    
    try {
      console.log("Cargando datos para farmId:", farmId);
      
      // Cargar dispositivos y tanques en paralelo (sin interferir con la selección)
      await Promise.all([
        fetchDevicesAndMark(farmId, 1, ''),
        fetchTanksAndMark(farmId, 1, '')
      ]);
      
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("Error al cargar datos iniciales:", error);
    }
  }, [isOpen, session, fetchDevicesAndMark, fetchTanksAndMark]);
  // Reset states when modal opens and fetch equipment data
  useEffect(() => {
    if (isOpen && equipmentId) {
      fetchEquipmentData();
    }
  }, [isOpen, equipmentId]);
  // Fetch equipment data
  const fetchEquipmentData = async () => {
    if (!session?.accessToken || !equipmentId) {
      return;
    }

    try {
      setInitialLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/${equipmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      
      if (!mountedRef.current) return;
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del equipamiento');
      }
      
      const data = await response.json();
      
      if (!mountedRef.current) return;
      
      console.log("Equipamiento obtenido (respuesta completa):", JSON.stringify(data));
      
      // Set equipment info
      setEquipmentInfo({
        name: data.name || '',
        type: data.type || '',
        farm: data.farm._id || data.farm || '',
        description: data.description || ''
      });

      // Set initial filters based on equipment type
      const deviceTypes = getDeviceTypesByEquipmentType(data.type);
      setSelectedFilters({ type: deviceTypes });

      // Prepara los arrays de IDs para dispositivos y tanques
      // Manejar diferentes formatos de respuesta del API
      let deviceIds: string[] = [];
      if (Array.isArray(data.devices)) {
        deviceIds = data.devices.map((device: { _id: string } | string) => typeof device === 'string' ? device : device._id);
      }
      
      let tankIds: string[] = [];
      if (Array.isArray(data.associatedTanks)) {
        tankIds = data.associatedTanks.map((tank: { _id: string } | string) => typeof tank === 'string' ? tank : tank._id);
      }
      
      console.log("DeviceIds a marcar:", deviceIds);
      console.log("TankIds a marcar:", tankIds);

      // Crear diccionarios para IDs seleccionados y establecer el estado ANTES de cargar datos
      const initialDeviceSelection: Record<string, boolean> = {};
      deviceIds.forEach(id => { initialDeviceSelection[id] = true; });
      
      const initialTankSelection: Record<string, boolean> = {};
      tankIds.forEach(id => { initialTankSelection[id] = true; });
      
      // Establecer los estados de selección ANTES de cargar datos (como en user-edit-modal)
      setSelectedDevices(initialDeviceSelection);
      setSelectedTanks(initialTankSelection);

      console.log("Estado de selección inicial establecido:");
      console.log("- Dispositivos:", initialDeviceSelection);
      console.log("- Tanques:", initialTankSelection);

      // Cargar datos para la primera página de cada tabla DESPUÉS de establecer la selección
      // Esperar un poco para que los filtros se establezcan correctamente
      setTimeout(() => {
        if (mountedRef.current) {
          initData(data.farm._id || data.farm);
        }
      }, 100);
      
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error al obtener datos del equipamiento:', error);
      toast({
        title: "No se pueden modificar los datos",
        description: "No se ha podido obtener la información del equipamiento para su modificación",
        variant: "destructive",
      });
      handleClose();
    } finally {
      if (mountedRef.current) {
        setInitialLoading(false);
      }
    }
  };

  // Comentado para evitar conflictos con la carga inicial de datos
  // useEffect(() => {
  //   if (isOpen && equipmentInfo.farm && equipmentInfo.type) {
  //     initData(equipmentInfo.farm);
  //   }
  // }, [isOpen, equipmentInfo.farm, equipmentInfo.type, initData]);

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

  // Sincronizar selectedFilters cuando cambie equipmentInfo.type
  useEffect(() => {
    if (equipmentInfo.type) {
      const deviceTypes = getDeviceTypesByEquipmentType(equipmentInfo.type);
      setSelectedFilters({ type: deviceTypes });
    }
  }, [equipmentInfo.type]);


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

  // Evitar re-renderizados innecesarios al manejar los filtros
  const handleFilterChange = useCallback((filters: Record<string, string[]>) => {
    setSelectedFilters(filters);
    setDevicesPage(1);
  }, []);

  // Asegurar que los datos no se borren al cambiar filtros o paginación
  useEffect(() => {
    if (isOpen && equipmentInfo.farm && equipmentInfo.type && selectedFilters.type.length > 0) {
      fetchDevicesAndMark(equipmentInfo.farm, devicesPage, devicesSearchTerm);
    }
  }, [devicesPage, devicesSearchTerm, isOpen, equipmentInfo.farm, equipmentInfo.type, selectedFilters.type, fetchDevicesAndMark]);


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
  
  // Simplificando los manejadores de selección para evitar re-renderizados innecesarios
  const handleDeviceSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedDevices(selectedRowIds);
  };

  const handleTankSelectionChange = (selectedRowIds: Record<string, boolean>) => {
    setSelectedTanks(selectedRowIds);
  };
  
  const handleClose = () => {
    // Resetear estados antes de cerrar
    setLoading(false);
    setInitialLoading(false);
    setDevicesTotalItems(0);
    setDevicesTotalPages(1);
    setDevices([]);
    setSelectedDevices({});
    setSelectedTanks({});
    setDevicesPage(1);
    setTanksPage(1);
    setDevicesSearchTerm('');
    setTanksSearchTerm('');
    
    // Cerrar el modal
    onClose();
  };  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      // Recuperar todos los IDs seleccionados de dispositivos y tanques
      const selectedDeviceIds = Object.entries(selectedDevices)
        .filter(([_, isSelected]) => isSelected)
        .map(([deviceId, _]) => deviceId);
        
      const selectedTankIds = Object.entries(selectedTanks)
        .filter(([_, isSelected]) => isSelected)
        .map(([tankId, _]) => tankId);
      
      console.log("Dispositivos seleccionados para enviar:", selectedDeviceIds);
      console.log("Tanques seleccionados para enviar:", selectedTankIds);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/${equipmentId}`, {
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
      
      // Si el componente se desmontó durante la solicitud, salir sin hacer más cambios
      if (!mountedRef.current) return;
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al actualizar el equipamiento');
      }
      
      toast({
        description: "Equipo actualizado con éxito",
        variant: "success",
      });
      
      // Resetear el estado de carga antes de cerrar el modal
      setLoading(false);
      handleClose();
      onRefresh();
    } catch (error) {
      // Si el componente se desmontó durante la solicitud, salir sin hacer más cambios
      if (!mountedRef.current) return;
      
      console.error('Error al actualizar el equipamiento:', error);
      toast({
        title: "Error al actualizar el equipamiento",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
      
      // Asegurarse de resetear el estado de carga incluso si hay un error
      setLoading(false);
    }
  };

  const isFormValid = 
    equipmentInfo.name.trim() !== '' && 
    equipmentInfo.type !== '';
    
  // Don't render anything while loading
  if (initialLoading && isOpen) {
    return null;
  }

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
                        disabled={loading}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                      <Select 
                        value={equipmentInfo.type} 
                        onValueChange={handleTypeChange} 
                        disabled={loading}
                      >
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
                              _loading={loading}
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
                          <div className="min-w-full px-4 sm:px-0">                            <DataTable<AssociatedTank>
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
                              _loading={loading}
                              key="tank-table"
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
                    {loading ? (
                      <div className="flex items-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Actualizando...
                      </div>
                    ) : "Actualizar equipamiento"}
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
