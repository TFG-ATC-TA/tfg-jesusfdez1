'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckIcon, XIcon } from 'lucide-react';

interface MilkCollectionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
}

export const MilkCollectionViewModal: React.FC<MilkCollectionViewModalProps> = ({ isOpen, onClose, collectionId }) => {
  const { data: session } = useSession();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
          const response = await fetch(`http://localhost:5001/collection/${collectionId}`, {
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
          setCollection(data);
        } catch (error) {
          console.error('Error al obtener los datos de la recogida:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error desconocido al cargar los datos",
            variant: "destructive",
          });
          onClose();
        } finally {
          setLoading(false);
        }
      };
      
      fetchCollectionData();
    }
  }, [isOpen, session, collectionId]);

  if (loading || !collection) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
            <DialogTitle className="text-lg font-bold">Detalles de recogida (E10)</DialogTitle>
          </div>
          <div className="p-6 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Detalles de recogida (E10)</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Información de recogida de leche</CardTitle>
              </div>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha y hora de recogida</h3>
                    <p className="mt-1 text-lg font-semibold">
                      {format(new Date(collection.collectionDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Etiqueta de muestra</h3>
                    <p className="mt-1 text-lg font-semibold">{collection.sampleLabel}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa de recogida</h3>
                    <p className="mt-1 text-lg font-semibold">{collection.collectionCompany}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula de cisterna</h3>
                    <p className="mt-1 text-lg font-semibold">{collection.cisternLicensePlate || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conductor</h3>
                    <p className="mt-1 text-lg font-semibold">{collection.driver || "-"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Temperatura de la leche</h3>
                    <p className="mt-1 text-lg font-semibold">
                      {collection.milkTemperature ? `${collection.milkTemperature} °C` : "-"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Muestra de inhibidores</h3>
                    <div className="mt-2">
                      {collection.inhibitorSampleTaken ? (
                        <div className="flex items-center">
                          <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                          <span>Muestra tomada</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XIcon className="mr-2 h-5 w-5 text-red-500" />
                          <span>No se tomó muestra</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Tanques y litros recogidos</h3>
                  <div className="space-y-4">
                    {collection.litersPerTank && collection.litersPerTank.length > 0 ? (
                      collection.litersPerTank.map((tank: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanque</h4>
                              <p className="mt-1 font-semibold">{tank.tankId?.name || "Tanque no disponible"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Litros</h4>
                              <p className="mt-1 font-semibold">{tank.liters} L</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Compartimento</h4>
                              <p className="mt-1 font-semibold">{tank.compartment || "Único"}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No hay información de tanques disponible</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button onClick={onClose}>Cerrar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};