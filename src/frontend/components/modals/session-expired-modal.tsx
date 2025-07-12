/**
 * Modal de sesión expirada
 * Se muestra cuando la sesión del usuario ha finalizado por motivos de seguridad
 * Previene interacciones externas y fuerza al usuario a volver a autenticarse
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { X } from 'lucide-react';

/**
 * Props del modal de sesión expirada
 */
interface SessionExpiredModalProps {
  isOpen: boolean;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Maneja el proceso de cierre de sesión
   * Limpia los datos locales y redirige al login
   */
  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      // Limpiar datos del usuario del localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-data');
      }
      
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Forzar logout incluso si hay un error
      window.location.href = '/login';
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}}
    >
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl [&>button]:hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="p-6">
          {/* Header con icono de advertencia */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold">
              Sesión finalizada
            </h2>
          </div>
          
          {/* Mensaje explicativo */}
          <div className="text-muted-foreground text-sm mb-6">
            <p>
              Su sesión ha finalizado por motivos de seguridad. Por favor, inicie sesión nuevamente para continuar utilizando la aplicación.
            </p>
          </div>
          
          {/* Botón de acción */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleLogout} 
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              {isProcessing ? "Procesando..." : "Iniciar sesión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
