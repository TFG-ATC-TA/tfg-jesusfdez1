'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Plus, Trash } from 'lucide-react';

// Define un tipo para un tanque en la recogida
interface TankCollection {
  tankId: { _id: string };
  liters: number;
  compartment: string;
}

interface MilkCollectionEditModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  collectionId: string;
  onRefreshAction: () => void;
}

export const MilkCollectionEditModal: React.FC<MilkCollectionEditModalProps> = ({ 
  isOpen, 
  onCloseAction, 
  collectionId, 
  onRefreshAction 
}) => {
  const { data: session } = useSession();
  const [collectionInfo, setCollectionInfo] = useState({
    collectionDate: '',
    cisternLicensePlate: '',
    collectionCompany: '',
    driver: '',
    tankId: '',
    sampleLabel: '',
    milkTemperature: 0,
    inhibitorSampleTaken: false,
    litersPerTank: [] as TankCollection[],
    farmId: ''
  });
  const [tanks, setTanks] = useState<Array<{ _id: string; identifier: string; capacity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && collectionId) {
      const fetchCollectionData = async () => {
        if (!session?.accessToken) {
          console.error('No hay sesión iniciada');
          toast({
            title: "Error",
            description: "No hay sesión iniciada",
            variant: "destructive",
          });
          return;
        }

        setLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection/${collectionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los datos de la recogida');
          }
          
          const data = await response.json();
          
          // Obtener el farmId para luego cargar los tanques
          const farmId = data.farmId || '';
          
          // Formatear la fecha para el input datetime-local
          const collectionDate = format(new Date(data.collectionDate), "yyyy-MM-dd'T'HH:mm");
          
          setCollectionInfo({
            ...data,
            collectionDate,
            farmId
          });
          
          // Cargar los tanques de la granja
          if (farmId) {
            await fetchTanks(farmId);
          }
        } catch (error) {
          console.error('Error al obtener los datos de la recogida:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error desconocido al cargar los datos",
            variant: "destructive",
          });
          onCloseAction();
        } finally {
          setLoading(false);
        }
      };
      
      fetchCollectionData();
    }
  }, [isOpen, session, collectionId]);

  const fetchTanks = useCallback(async (farmId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/listTanks?farmId=${farmId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session?.accessToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener los tanques');
      }
      
      const data = await response.json();
      setTanks(data);
    } catch (error) {
      console.error('Error al obtener tanques:', error);
      toast({
        title: "Error al cargar tanques",
        description: error instanceof Error ? error.message : "Error al obtener el listado de tanques",
        variant: "destructive",
      });
    }
  }, [session?.accessToken, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    
    if (type === 'number') {
      setCollectionInfo({ ...collectionInfo, [id]: parseFloat(value) });
    } else {
      setCollectionInfo({ ...collectionInfo, [id]: value });
    }
  };

  const handleTankChange = (index: number, field: keyof TankCollection, value: string | number) => {
    const updatedTanks = [...collectionInfo.litersPerTank];
    updatedTanks[index] = { 
      ...updatedTanks[index], 
      [field]: field === 'liters' ? parseFloat(value as string) : value 
    };
    setCollectionInfo({ ...collectionInfo, litersPerTank: updatedTanks });
  };

  const addTank = () => {
    if (tanks.length > 0) {
      setCollectionInfo({
        ...collectionInfo,
        litersPerTank: [
          ...collectionInfo.litersPerTank,
          { tankId: { _id: tanks[0]._id }, liters: 0, compartment: 'Único' }
        ]
      });
    }
  };

  const removeTank = (index: number) => {
    const updatedTanks = [...collectionInfo.litersPerTank];
    updatedTanks.splice(index, 1);
    setCollectionInfo({ ...collectionInfo, litersPerTank: updatedTanks });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const updateCollection = async () => {
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
        const payload = {
          ...collectionInfo,
          collectionDate: new Date(collectionInfo.collectionDate).toISOString()
        };
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection/${collectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al actualizar la recogida de leche');
        }
        
        toast({
          description: "Recogida de leche actualizada con éxito",
          variant: "success",
        });
        onCloseAction();
        onRefreshAction();
      } catch (error) {
        console.error('Error al actualizar la recogida de leche:', error);
        toast({
          title: "Error al actualizar la recogida de leche",
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: "destructive",
        });
      }
    };
    
    updateCollection();
  };

  const handleDelete = async () => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection/${collectionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la recogida de leche');
      }
      
      toast({
        description: "Recogida de leche eliminada con éxito",
        variant: "success",
      });
      setShowDeleteAlert(false);
      onCloseAction();
      onRefreshAction();
    } catch (error) {
      console.error('Error al eliminar la recogida de leche:', error);
      toast({
        title: "Error al eliminar la recogida de leche",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    }
  };

  const isFormValid = 
    collectionInfo.collectionDate && 
    collectionInfo.sampleLabel && 
    collectionInfo.collectionCompany && 
    collectionInfo.litersPerTank.length > 0 && 
    collectionInfo.litersPerTank.every(tank => tank.tankId && tank.liters > 0);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
            <DialogTitle className="text-lg font-bold">Editar recogida de leche</DialogTitle>
          </div>
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCloseAction}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
            <DialogTitle className="text-lg font-bold">Editar recogida de leche</DialogTitle>
          </div>
          <ScrollArea className="flex-grow">
            <div className="p-4 md:p-6 space-y-6">
              <Card>
                <div className="px-4 md:px-6 mt-6">
                  <CardTitle className="mb-4">Datos de la recogida</CardTitle>
                </div>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="collectionDate">Fecha y hora de recogida <span className="text-red-500">*</span></Label>
                        <Input 
                          id="collectionDate" 
                          type="datetime-local" 
                          value={collectionInfo.collectionDate} 
                          onChange={handleInputChange} 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sampleLabel">Etiqueta de muestra <span className="text-red-500">*</span></Label>
                        <Input 
                          id="sampleLabel" 
                          value={collectionInfo.sampleLabel} 
                          onChange={handleInputChange} 
                          placeholder="Ej. EL-123456" 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="collectionCompany">Empresa de recogida <span className="text-red-500">*</span></Label>
                        <Input 
                          id="collectionCompany" 
                          value={collectionInfo.collectionCompany} 
                          onChange={handleInputChange} 
                          placeholder="Nombre de la empresa" 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cisternLicensePlate">Matrícula de cisterna</Label>
                        <Input 
                          id="cisternLicensePlate" 
                          value={collectionInfo.cisternLicensePlate} 
                          onChange={handleInputChange} 
                          placeholder="Ej. 1234ABC" 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driver">Conductor</Label>
                        <Input 
                          id="driver" 
                          value={collectionInfo.driver} 
                          onChange={handleInputChange} 
                          placeholder="Nombre del conductor" 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="milkTemperature">Temperatura de la leche (°C)</Label>
                        <Input 
                          id="milkTemperature" 
                          type="number" 
                          step="0.1" 
                          value={collectionInfo.milkTemperature} 
                          onChange={handleInputChange} 
                          className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                        />
                      </div>
                      <div className="space-y-2 flex items-center">
                        <div className="flex items-center space-x-2 mt-8">
                          <Checkbox 
                            id="inhibitorSample" 
                            checked={collectionInfo.inhibitorSampleTaken}
                            onCheckedChange={(checked) => 
                              setCollectionInfo({ ...collectionInfo, inhibitorSampleTaken: checked as boolean })
                            }
                          />
                          <Label htmlFor="inhibitorSample">Muestra de inhibidores tomada</Label>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle>Tanques y litros recogidos</CardTitle>
                        <Button 
                          type="button" 
                          onClick={addTank} 
                          className="h-9 w-9 px-2.5 text-sm flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5 mr-0.5 ml-0.5" />
                        </Button>
                      </div>
                      
                      {collectionInfo.litersPerTank.map((tank, index) => (
                        <div key={index} className="flex items-start gap-4 mb-4">
                          <div className="flex-grow border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Tanque <span className="text-red-500">*</span></Label>
                                <Select 
                                  value={tank.tankId._id} 
                                  onValueChange={(value) => handleTankChange(index, 'tankId', value)}
                                >
                                  <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                                    <SelectValue placeholder="Seleccionar tanque" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tanks.map(t => (
                                      <SelectItem 
                                        key={t._id} 
                                        value={t._id}
                                      >
                                        {t.identifier}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Litros <span className="text-red-500">*</span></Label>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  value={tank.liters} 
                                  onChange={(e) => handleTankChange(index, 'liters', e.target.value)}
                                  className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Compartimento</Label>
                                <Input 
                                  value={tank.compartment} 
                                  onChange={(e) => handleTankChange(index, 'compartment', e.target.value)}
                                  className="bg-white dark:bg-gray-800 text-black dark:text-white" 
                                  placeholder="Ej. Único, A, B, ..."
                                />
                              </div>
                            </div>
                          </div>
                          {collectionInfo.litersPerTank.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeTank(index)} 
                              className="h-9 w-10 p-0 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                              >
                                <Trash className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      id="submit-collection" 
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

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de que desea eliminar esta recogida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la recogida de leche
              y toda la información asociada a ella.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
