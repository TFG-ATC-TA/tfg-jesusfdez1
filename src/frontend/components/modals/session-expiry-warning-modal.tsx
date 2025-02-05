'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SessionExpiryWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export const SessionExpiryWarningModal: React.FC<SessionExpiryWarningModalProps> = ({
  isOpen,
  onContinue,
  onClose
}) => {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300); // Reset timer when modal is closed
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onClose(); // Close warning modal when time is up
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const handleContinueSession = async () => {
    setIsProcessing(true);
    try {
      // Extend session here - implementation depends on your authentication method
      onContinue();
      
      toast({
        description: "Su sesión ha sido extendida exitosamente",
        variant: "success",
      });
    } catch (error) {
      console.error('Error al extender la sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo extender la sesión. Por favor, vuelva a iniciar sesión.",
        variant: "destructive",
      });
      await handleLogout();
    } finally {
      setIsProcessing(false);
    }
  };

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
      signOut({ callbackUrl: '/login' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / 300) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl">
        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <div 
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold">
              Sesión a punto de expirar
            </h2>
          </div>
          
          {/* Message */}
          <div className="text-muted-foreground text-sm mb-6 space-y-3">
            <p>
              Su sesión expirará en breve debido a inactividad. Por motivos de seguridad, será redirigido a la página de inicio de sesión.
            </p>
            
            {/* Time counter */}
            <div className="flex items-center space-x-2 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span>Tiempo restante: <span className="font-bold">{formatTime(timeLeft)}</span></span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
            <Button 
              onClick={handleLogout} 
              variant="outline"
              disabled={isProcessing}
              className="border-2 hover:bg-accent transition-colors"
            >
              Cerrar sesión ahora
            </Button>
            <Button 
              onClick={handleContinueSession} 
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              Continuar sesión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
