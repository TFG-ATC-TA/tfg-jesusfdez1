/**
 * Modal para crear nuevas granjas en el sistema
 * Permite configurar datos básicos de la granja como nombre e identificador
 * Incluye validaciones de formulario y gestión de errores
 * Proporciona una interfaz sencilla para la gestión de granjas
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Componente modal para crear nuevas granjas
 * Gestiona la creación de granjas con validaciones básicas
 * Permite registrar granjas con nombre e identificador único
 */
const FarmAddModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({ isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  
  // Estado para la información de la granja
  // Almacena los datos básicos de la granja a crear
  const [farmInfo, setFarmInfo] = useState({
    name: '',
    idname: ''
  });

  const { toast } = useToast();

  /**
   * Maneja los cambios en los campos del formulario
   * Actualiza el estado local con los nuevos valores del input
   * @param e - Evento de cambio del input
   */
  const handleFarmInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFarmInfo({ ...farmInfo, [e.target.id]: e.target.value });
  };

  /**
   * Reinicia el formulario a sus valores iniciales
   * Limpia todos los campos y restaura valores por defecto
   */
  const resetForm = () => {
    setFarmInfo({
      name: '',
      idname: ''
    });
  };

  /**
   * Maneja el cierre del modal y reinicia el formulario
   * Llama a la función de cierre proporcionada por el padre
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * Maneja el envío del formulario
   * Valida los datos y crea la granja en el sistema
   * @param e - Evento de envío del formulario
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = (e as React.FormEvent<HTMLFormElement> & { nativeEvent: SubmitEvent }).nativeEvent.submitter as HTMLButtonElement;
    if (target && target.id === 'submit-data-button') {
      const createFarm = async () => {
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
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/farm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${session.accessToken}`,
            },
            body: JSON.stringify(farmInfo),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear la granja');
          }
          
          console.log('Granja creada con éxito');
          toast({
            description: "Granja creada con éxito",
            variant: "success",
          });
          handleClose();
          onRefresh();
        } catch (error) {
          console.error('Error al crear la granja:', error);
          toast({
            title: "Error al crear la granja",
            description: error instanceof Error ? error.message : 'Error desconocido',
            variant: "destructive",
          });
        }
      };
      createFarm();
    }
  };

  /**
   * Valida que el formulario esté completo
   * Verifica que todos los campos obligatorios estén llenos
   */
  const isFormValid = farmInfo.name && farmInfo.idname;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[65vh] sm:h-[55vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Crear nueva granja</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Datos de la granja</CardTitle>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
                      <Input id="name" value={farmInfo.name} onChange={handleFarmInfoChange} placeholder="Ingrese el nombre de la granja" className="bg-white dark:bg-gray-800 text-black dark:text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idname">ID de la granja <span className="text-red-500">*</span></Label>
                      <Input id="idname" value={farmInfo.idname} onChange={handleFarmInfoChange} placeholder="Ingrese el ID de la granja" className="bg-white dark:bg-gray-800 text-black dark:text-white" required />
                    </div>
                  </div>
                  <Separator />
                  <p className="text-gray-500 text-sm">Nota: Para añadir usuarios y dispositivos a la granja, diríjase a la sección correspondiente en la aplicación.</p>
                  <Button id="submit-data-button" type="submit" disabled={!isFormValid}>Crear granja</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default FarmAddModal;

