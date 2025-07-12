/**
 * Componente de acciones para celdas de la tabla de usuarios
 * Proporciona menú desplegable con opciones de editar y eliminar
 * Incluye confirmación de eliminación y manejo de errores
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import UserEditModal from '@/components/modals/user-edit-modal';
import { User } from '@/types';

/**
 * Props del componente de acciones de celda
 * Define los datos del usuario y función de actualización
 */
interface CellActionProps {
  data: User;
  onRefresh: () => void;
}

/**
 * Componente que renderiza las acciones disponibles para cada usuario
 * Incluye modal de edición y diálogo de confirmación de eliminación
 * Maneja estados de carga y proporciona feedback al usuario
 */
export const CellAction: React.FC<CellActionProps> = ({ data, onRefresh }) => {
  const { data: session } = useSession();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast()

  /**
   * Función para eliminar un usuario
   * Realiza petición DELETE al backend y maneja la respuesta
   * Incluye validación de sesión y manejo de errores
   */
  const onDelete = async () => {
    try {
      if (!session?.accessToken) {
        toast({
          title: "Error",
          description: "No hay sesión iniciada",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/${data._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      onRefresh();
      
      toast({
        description: "Usuario eliminado correctamente",
        variant: "success",
      });
    } catch (_error) {
      toast({
        title: "Error al eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Modal de edición de usuario */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userId={data._id}
        onRefresh={onRefresh}
      />
      
      {/* Diálogo de confirmación para eliminación */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este registro de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 text-white hover:bg-red-700">Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menú desplegable con opciones de acción */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-4 w-12 p-0 flex items-center">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" /> Actualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteAlert(true)}>
            <Trash className="mr-2 h-4 w-4" /> Borrar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

