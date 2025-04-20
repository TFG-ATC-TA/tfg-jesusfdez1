'use client';
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
import { Edit, MoreHorizontal, Trash, ExternalLink } from 'lucide-react';
import FarmEditModal from '@/components/modals/farm-edit-modal';
import { Farm } from '@/types';
import { useRouter } from 'next/navigation';

interface CellActionProps {
  data: Farm;
  onRefresh: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onRefresh }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast()

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

      const response = await fetch(`http://localhost:5001/farm/${data._id}`, {
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
        description: "Granja eliminada correctamente",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error al eliminar la granja",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <FarmEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        farmId={data._id}
        onRefresh={onRefresh}
      />
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta granja de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 text-white hover:bg-red-700">Borrar</AlertDialogAction>
          </AlertDialogFooter>        </AlertDialogContent>
      </AlertDialog>      <div className="flex items-center gap-2">
        <Button  
          className="h-6 w-12 p-0 flex items-center"   
          onClick={() => router.push(`/farms/${data.idname}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        {session?.user?.role === 'Administrador' && (
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
        )}
      </div>
    </>
  );
};
