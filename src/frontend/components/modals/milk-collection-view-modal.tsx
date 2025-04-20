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

  const ticketColor = theme === 'dark' ? '#111827' : '#ffffff';

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
      <Dialog open={isOpen} onOpenChange={onClose}>        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:bg-white dark:[&>button]:bg-gray-900 [&>button]:rounded-lg [&>button]:shadow">
          <div className="bg-transparent max-w-lg mx-auto relative overflow-hidden">
            <div className="sawtooth"></div>
            <div className="bg-white dark:bg-gray-900 px-1 py-3">
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
    <Dialog open={isOpen} onOpenChange={onClose}>      <style jsx global>{`
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
          background-image: linear-gradient(90deg, transparent, rgba(156, 163, 175, 0.3) 50%, transparent 100%);        }
      `}</style>      <DialogContent className="sm:max-w-[500px] md:max-w-[550px] p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:bg-white dark:[&>button]:bg-gray-900 [&>button]:rounded-lg [&>button]:shadow">
        <div className="bg-transparent max-w-lg mx-auto relative overflow-hidden">
          <div className="sawtooth"></div>
          <div className={`bg-white dark:bg-gray-900 px-4 py-5`}>
            <ScrollArea className="h-[calc(75vh-48px)] pl-2 pr-4 scrollbar-thin scrollbar-thumb-gray-600 dark:scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-700 dark:hover:scrollbar-thumb-gray-100">
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
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-3 rounded-lg text-center shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Total leche recogida</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalLiters.toLocaleString('es-ES')} L</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-3 rounded-lg text-center shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Temperatura</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{collection.milkTemperature ? `${collection.milkTemperature}°C` : '—'}</p>
                  </div>
                </div>
              </div>              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">Información de transporte</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 shadow-sm">                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Empresa</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 break-words">{collection.collectionCompany || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conductor</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 break-words">{collection.driver || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Matrícula</p>
                        <p className="font-medium font-mono text-gray-800 dark:text-gray-100">{collection.cisternLicensePlate || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Muestra inhibidores</p>
                        <div className="font-medium">
                          {collection.inhibitorSampleTaken ? (
                            <div className="flex items-center">
                              <CheckIcon className="mr-1 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-gray-800 dark:text-gray-100">Sí</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XIcon className="mr-1 h-3.5 w-3.5 text-red-500" />
                              <span className="text-gray-800 dark:text-gray-100">No</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {collection.litersPerTank && collection.litersPerTank.length > 0 && (                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Detalle por tanques</h3>
                  </div>                  <div className="space-y-2">
                    {collection.litersPerTank.map((tank: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg border shadow-sm bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{tank.tankId?.name || '—'}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{tank.compartment ? `Compartimento: ${tank.compartment}` : 'Compartimento único'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{parseFloat(tank.liters).toLocaleString('es-ES')} L</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
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