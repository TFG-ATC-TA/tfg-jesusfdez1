/**
 * Modal para editar dispositivos IoT existentes en el sistema
 * Permite modificar datos, sensores, granja y equipo asignado
 * Incluye validaciones y feedback visual para el usuario
 * Proporciona una interfaz completa para la edición de dispositivos
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Farm } from '@/types';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Trash, Plus, Icon } from 'lucide-react';
import { broom } from '@lucide/lab';

/**
 * Clase CSS para contenedores de botones
 * Mantiene consistencia en el diseño de botones
 */
const buttonContainer = "flex items-center space-x-2";

/**
 * Componente modal para editar dispositivos IoT
 * Permite modificar datos, sensores, granja y equipo asignado
 * Incluye validaciones y feedback visual para el usuario
 */
const DeviceEditModal: React.FC<{ isOpen: boolean; onClose: () => void; deviceId: string; onRefresh: () => void }> = ({ isOpen, onClose, deviceId, onRefresh }) => {
  const { data: session } = useSession();
  
  // Estado para la información del dispositivo
  // Almacena todos los datos del dispositivo incluyendo sensores
  const [deviceInfo, setDeviceInfo] = useState({
    boardId: '',
    type: '',
    farm: '',
    description: '',
    sensors: [{ sensorId: '', name: '' }],
    equipment: '',
  });
  
  // Estados para gestión de granjas y equipos
  // Maneja las listas de granjas y equipos disponibles para asignación
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmFilter, setFarmFilter] = useState('');
  const [equipments, setEquipments] = useState<Array<{ _id: string; name: string; type: string }>>([]);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  /**
   * Efecto para cargar los datos del dispositivo al abrir el modal
   * Obtiene la información actual del dispositivo desde la API
   */
  useEffect(() => {
    if (isOpen) {
      const fetchDeviceData = async () => {
        if (!session?.accessToken) {
          console.error('No hay sesión iniciada');
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          return;
        }
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/device/${deviceId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Error al obtener datos del dispositivo');
          }

          setDeviceInfo({
            boardId: data.boardId,
            type: data.type,
            farm: data.farm,
            description: data.description,
            sensors: data.sensors.map((sensor: { sensorId: string; name: string }) => ({
              sensorId: sensor.sensorId,
              name: sensor.name,
            })),
            equipment: data.equipment,
          });
          setLoading(false);
        } catch (error) {
          console.error('Error al obtener datos del dispositivo:', error);
          toast({
            title: "Error al cargar el dispositivo",
            description: error instanceof Error ? error.message : "Error desconocido al cargar los datos",
            variant: "destructive",
          });
          onClose();
        }
      };
      fetchDeviceData();
    }
  }, [isOpen, session, deviceId, onClose, toast]);

  /**
   * Efecto para cargar granjas cuando se abre el modal
   * Obtiene la lista de granjas disponibles para asignación
   */
  useEffect(() => {
    if (isOpen && farms.length === 0) {
      const fetchFarms = async () => {
        if (!session?.accessToken) {
          console.error('No hay sesión iniciada');
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          return;
        }
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/farm/listName`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Error al obtener las granjas');
          }
          setFarms(data);
        } catch (error) {
          console.error('Error al obtener granjas:', error);
          toast({
            title: "Error al cargar granjas",
            description: error instanceof Error ? error.message : "Error al obtener el listado de granjas",
            variant: "destructive",
          });
        }
      };
      fetchFarms();
    }
  }, [isOpen, session, farms.length, toast]);

  /**
   * Efecto para cargar equipos cuando se abre el modal
   * Obtiene la lista de equipos disponibles para asignación
   */
  useEffect(() => {
    if (isOpen && equipments.length === 0) {
      const fetchEquipments = async () => {
        if (!session?.accessToken) {
          console.error('No hay sesión iniciada');
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          return;
        }
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/listName`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Error al obtener los equipos');
          }
          setEquipments(data);
        } catch (error) {
          console.error('Error al obtener equipos:', error);
          toast({
            title: "Error al cargar equipos",
            description: error instanceof Error ? error.message : "Error al obtener el listado de equipos",
            variant: "destructive",
          });
        }
      };
      fetchEquipments();
    }
  }, [isOpen, session, equipments.length, toast]);

  /**
   * Maneja cambios en los campos del dispositivo
   * Actualiza el estado local con los nuevos valores del input
   * @param e - Evento de cambio del input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDeviceInfo({ ...deviceInfo, [e.target.id]: e.target.value });
  };

  /**
   * Maneja cambios en los sensores del dispositivo
   * Actualiza campos específicos de un sensor en el array
   * @param index - Índice del sensor a modificar
   * @param e - Evento de cambio del input
   */
  const handleSensorChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newSensors = [...deviceInfo.sensors];
    const { id, value } = e.target;
    if (id === 'sensorId' || id === 'name') {
      newSensors[index][id] = value;
    setDeviceInfo({ ...deviceInfo, sensors: newSensors });
    }
  };

  /**
   * Añade un nuevo sensor al dispositivo
   * Crea una nueva entrada de sensor con valores por defecto
   */
  const handleAddSensor = () => {
    setDeviceInfo({ ...deviceInfo, sensors: [...deviceInfo.sensors, { sensorId: '', name: '' }] });
  };

  /**
   * Elimina un sensor del dispositivo
   * Remueve el sensor del array de sensores
   * @param index - Índice del sensor a eliminar
   */
  const handleRemoveSensor = (index: number) => {
    const newSensors = deviceInfo.sensors.filter((_, i) => i !== index);
    setDeviceInfo({ ...deviceInfo, sensors: newSensors });
  };

  /**
   * Maneja el envío del formulario
   * Valida los datos y actualiza el dispositivo en el sistema
   * @param e - Evento de envío del formulario
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updateDevice = async () => {
      if (!session?.accessToken) {
        console.error('No hay sesión iniciada');
        toast({
          title: "Error",
          description: "No hay sesión iniciada",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/device/${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
          body: JSON.stringify(deviceInfo),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al actualizar el dispositivo');
        }

        console.log('Dispositivo actualizado con éxito');
        toast({
          description: "Dispositivo actualizado con éxito",
          variant: "success",
        });
        onClose();
        onRefresh();
      } catch (error) {
        console.error('Error al actualizar el dispositivo:', error);
        toast({
          title: "Error al actualizar el dispositivo",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    };
    updateDevice();
  };

  const filteredFarms = farms
  .filter(farm => farm.name.toLowerCase().includes(farmFilter.toLowerCase()))
  .sort((a, b) => a.name.localeCompare(b.name));

  const filteredEquipments = equipments
  .filter(e => e.name.toLowerCase().includes(equipmentFilter.toLowerCase()))
  .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return null; // No renderizar nada mientras se cargan los datos
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Configuración del dispositivo seleccionado</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Datos del dispositivo</CardTitle>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de dispositivo <span className="text-red-500">*</span></Label>
                      <Select value={deviceInfo.type || ''} onValueChange={(value) => setDeviceInfo({ ...deviceInfo, type: value })}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                          <SelectValue placeholder="Seleccione un tipo de dispositivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monitor de leche">Monitor de leche</SelectItem>
                          <SelectItem value="Monitor de tanque">Monitor de tanque</SelectItem>
                          <SelectItem value="Monitor de estación de lavado">Monitor de estación de lavado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boardId">Identificador de placa <span className="text-red-500">*</span></Label>
                      <Input id="boardId" value={deviceInfo.boardId} onChange={handleInputChange} placeholder="Ingrese el identificador de placa" className="bg-white dark:bg-gray-800 text-black dark:text-white" />
                    </div>
                  </div>
   
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <textarea id="description" value={deviceInfo.description} onChange={handleInputChange} placeholder="Ingrese una descripción" className="bg-white dark:bg-gray-800 text-black dark:text-white w-full h-32 p-2 rounded-md resize-none text-sm" />
                  </div>

                  <Separator />

                  <CardTitle className="mb-4">Selección de granja</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmFilter">Filtrar granjas</Label>
                      <Input
                        id="farmFilter"
                        placeholder="Filtrar granjas"
                         className="bg-white dark:bg-gray-800 text-black dark:text-white"
                        value={farmFilter}
                        onChange={(e) => setFarmFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farm">Listado de granjas</Label>
                      <div className={buttonContainer}>
                        <Select value={deviceInfo.farm || ''} onValueChange={(value) => setDeviceInfo({ ...deviceInfo, farm: value })}>
                          <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                            <SelectValue placeholder="Seleccione una granja" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px] w-full">
                              {filteredFarms.map(farm => (
                                <SelectItem key={farm._id} value={farm._id}>{farm.name}</SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={() => setDeviceInfo({ ...deviceInfo, farm: '' })} className="h-9 w-11 p-0 bg-white dark:bg-gray-800 text-black dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                          <Icon iconNode={broom} className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <CardTitle className="mb-4">Selección de equipo</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipmentFilter">Filtrar equipos</Label>
                      <Input
                        id="equipmentFilter"
                        placeholder="Filtrar equipos"
                        className="bg-white dark:bg-gray-800 text-black dark:text-white"
                        value={equipmentFilter}
                        onChange={(e) => setEquipmentFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipment">Listado de equipos</Label>
                      <div className={buttonContainer}>
                        <Select
                          value={deviceInfo.equipment || ''} 
                          onValueChange={(value) => setDeviceInfo({ ...deviceInfo, equipment: value })}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                            <SelectValue placeholder="Seleccione un equipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px] w-full">
                              {filteredEquipments.map((equipment) => (
                                <SelectItem key={equipment._id} value={equipment._id}>
                                  {equipment.name}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={() => setDeviceInfo({ ...deviceInfo, equipment: '' })} className="h-9 w-11 p-0 bg-white dark:bg-gray-800 text-black dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                          <Icon iconNode={broom} className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between mb-4">
                    <CardTitle>Sensores</CardTitle>
                    <Button 
                      type="button" 
                      onClick={handleAddSensor}  
                      className="h-9 w-9 px-2.5 text-sm flex items-center justify-center" 
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5 ml-0.5" />
                    </Button>
                  </div>
                  {deviceInfo.sensors.map((sensor, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-grow border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`sensorId-${index}`}>ID del sensor <span className="text-red-500">*</span></Label>
                            <Input 
                              id="sensorId" 
                              value={sensor.sensorId} 
                              onChange={(e) => handleSensorChange(index, e)} 
                              placeholder="Ingrese el ID del sensor" 
                              className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>Nombre del sensor</Label>
                            <Input 
                              id="name" 
                              value={sensor.name} 
                              onChange={(e) => handleSensorChange(index, e)} 
                              placeholder="Ingrese el nombre del sensor" 
                              className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => handleRemoveSensor(index)} 
                        className="h-9 w-9 p-0 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button type="submit">Guardar cambios</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default DeviceEditModal;
