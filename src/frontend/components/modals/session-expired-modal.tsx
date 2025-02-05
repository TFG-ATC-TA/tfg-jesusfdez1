'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { X } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      // Clear user data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-data');
      }
      
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Force logout even if there's an error
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
          {/* Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-full">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold">
              Sesión finalizada
            </h2>
          </div>
          
          {/* Message */}
          <div className="text-muted-foreground text-sm mb-6">
            <p>
              Su sesión ha finalizado por motivos de seguridad. Por favor, inicie sesión nuevamente para continuar utilizando la aplicación.
            </p>
          </div>
          
          {/* Action button */}
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
