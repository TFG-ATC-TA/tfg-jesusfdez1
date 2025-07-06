'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Plus, Trash } from 'lucide-react';

// Define un tipo para un tanque en la recogida
interface TankCollection {
  tankId: string;
  liters: number;
  compartment: string;
}

interface MilkCollectionAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  onRefresh: () => void;
}

const MilkCollectionAddModal: React.FC<MilkCollectionAddModalProps> = ({ isOpen, onClose, farmId, onRefresh }) => {
  const { data: session } = useSession();
  const [collectionInfo, setCollectionInfo] = useState({
    collectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    cisternLicensePlate: '',
    collectionCompany: '',
    driver: '',
    tankId: '',
    sampleLabel: '',
    milkTemperature: 0,
    inhibitorSampleTaken: false,
    litersPerTank: [{ tankId: '', liters: 0, compartment: 'Único' }] as TankCollection[]
  });
  const [tanks, setTanks] = useState<Array<{ _id: string; identifier: string; capacity: number }>>([]);

  const { toast } = useToast();

  // Efecto para cargar los tanques al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchTanks = async () => {
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
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/equipment/listTanks?farmId=${farmId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los tanques');
          }
          
          const data = await response.json();
          setTanks(data);
          
          // Si hay tanques disponibles, establecer el primer tanque como predeterminado
          if (data.length > 0) {
            setCollectionInfo(prev => ({
              ...prev,
              litersPerTank: [{ tankId: data[0]._id, liters: 0, compartment: 'Único' }]
            }));
          }
        } catch (error) {
          console.error('Error al obtener tanques:', error);
          toast({
            title: "Error al cargar tanques",
            description: error instanceof Error ? error.message : "Error al obtener el listado de tanques",
            variant: "destructive",
          });
        }
      };
      
      fetchTanks();
    }
  }, [isOpen, session, farmId]);

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
          { tankId: tanks[0]._id, liters: 0, compartment: 'Único' }
        ]
      });
    }
  };

  const removeTank = (index: number) => {
    const updatedTanks = [...collectionInfo.litersPerTank];
    updatedTanks.splice(index, 1);
    setCollectionInfo({ ...collectionInfo, litersPerTank: updatedTanks });
  };

  const resetForm = () => {
    setCollectionInfo({
      collectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      cisternLicensePlate: '',
      collectionCompany: '',
      driver: '',
      tankId: '',
      sampleLabel: '',
      milkTemperature: 0,
      inhibitorSampleTaken: false,
      litersPerTank: [{ tankId: '', liters: 0, compartment: 'Único' }]
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const createCollection = async () => {
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
          farmId: farmId,
          collectionDate: new Date(collectionInfo.collectionDate).toISOString()
        };
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear la recogida de leche');
        }
        
        toast({
          description: "Recogida de leche creada con éxito",
          variant: "success",
        });
        handleClose();
        onRefresh();
      } catch (error) {
        console.error('Error al crear la recogida de leche:', error);
        toast({
          title: "Error al crear la recogida de leche",
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: "destructive",
        });
      }
    };
    
    createCollection();
  };

  const isFormValid = 
    collectionInfo.collectionDate && 
    collectionInfo.sampleLabel && 
    collectionInfo.collectionCompany && 
    collectionInfo.litersPerTank.length > 0 && 
    collectionInfo.litersPerTank.every(tank => tank.tankId && tank.liters > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Registrar nueva recogida de leche</DialogTitle>
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
                                value={tank.tankId} 
                                onValueChange={(value) => handleTankChange(index, 'tankId', value)}
                              >
                                <SelectTrigger className="bg-white dark:bg-gray-800 text-black dark:text-white">
                                  <SelectValue placeholder="Seleccionar tanque" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tanks.map(t => (
                                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
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
                    Guardar recogida
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MilkCollectionAddModal;