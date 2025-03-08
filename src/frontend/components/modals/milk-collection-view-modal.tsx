'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckIcon, XIcon, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const { theme } = useTheme();
  const [totalLiters, setTotalLiters] = useState<number>(0);

  const ticketColor = theme === 'dark' ? '#374151' : '#ffffff';

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
          
          // Calculate total liters
          if (data.litersPerTank && data.litersPerTank.length > 0) {
            const total = data.litersPerTank.reduce((sum: number, tank: any) => sum + parseFloat(tank.liters || 0), 0);
            setTotalLiters(total);
          }
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
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:bg-white dark:[&>button]:bg-gray-800 [&>button]:rounded-lg [&>button]:shadow">
          <div className="bg-transparent max-w-md mx-auto relative overflow-hidden">
            <div className="sawtooth"></div>
            <div className="bg-white dark:bg-gray-800 px-1 py-3">
              <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
            <div className="sawtooth rotate-180"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style jsx global>{`
        .dialog-overlay {
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        .sawtooth {
          height: 8px;
          background-image: 
            linear-gradient(45deg, transparent 33.333%, ${ticketColor} 33.333%, ${ticketColor} 66.667%, transparent 66.667%),
            linear-gradient(-45deg, transparent 33.333%, ${ticketColor} 33.333%, ${ticketColor} 66.667%, transparent 66.667%);
          background-size: 16px 16px;
          background-position: 0 0, 8px 0;
        }
        .ticket-header {
          position: relative;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .ticket-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-image: linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.3) 50%, transparent 100%);
        }
      `}</style>
      <DialogContent className="sm:max-w-[450px] md:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:bg-white dark:[&>button]:bg-gray-800 [&>button]:rounded-lg [&>button]:shadow">
        <div className="bg-transparent max-w-md mx-auto relative overflow-hidden">
          <div className="sawtooth"></div>
          <div className={`bg-white dark:bg-gray-800 px-4 py-5`}>
            <ScrollArea className="h-[calc(70vh-48px)] px-1">
              <div className="text-center mb-6 ticket-header">
                <div className="flex items-center justify-center mb-1">
                  <h2 className="text-xl font-bold dark:text-white">
                    Recogida #{collection.sampleLabel || 'Sin etiqueta'}
                  </h2>
                </div>
                <div className="flex justify-center items-center space-x-2">
                  <Badge variant="secondary" className="font-mono">
                    {format(new Date(collection.collectionDate), 'dd/MM/yyyy', { locale: es })}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-3 rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total leche recogida</p>
                    <p className="text-xl font-bold text-primary">{totalLiters.toLocaleString('es-ES')} L</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
                    <p className="text-xl font-bold">{collection.milkTemperature ? `${collection.milkTemperature}°C` : '—'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Información de transporte</h3>
                <div className="bg-muted/20 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="font-medium">{collection.collectionCompany || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Matrícula</p>
                      <p className="font-medium font-mono">{collection.cisternLicensePlate || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conductor</p>
                      <p className="font-medium">{collection.driver || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Muestra inhibidores</p>
                      <div className="font-medium">
                        {collection.inhibitorSampleTaken ? (
                          <div className="flex items-center">
                            <CheckIcon className="mr-1 h-3.5 w-3.5 text-green-500" />
                            <span>Sí</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XIcon className="mr-1 h-3.5 w-3.5 text-red-500" />
                            <span>No</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {collection.litersPerTank && collection.litersPerTank.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <ChevronDown className="h-4 w-4 text-primary mr-1" />
                    <h3 className="text-sm font-semibold text-muted-foreground">Detalle por tanques</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {collection.litersPerTank.map((tank: any, index: number) => (
                      <div key={index} className={cn(
                        "p-3 rounded-md border border-border",
                        index % 2 === 0 ? "bg-muted/10" : "bg-transparent"
                      )}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{tank.tankId?.name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{tank.compartment ? `Compartimento: ${tank.compartment}` : 'Compartimento único'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">{parseFloat(tank.liters).toLocaleString('es-ES')} L</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>{format(new Date(collection.collectionDate), 'EEEE, dd MMMM yyyy • HH:mm', { locale: es })}</p>
              </div>
            </ScrollArea>
          </div>
          <div className="sawtooth rotate-180"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};