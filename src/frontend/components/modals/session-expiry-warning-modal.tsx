/**
 * Modal de advertencia de expiración de sesión
 * Se muestra cuando la sesión está a punto de expirar
 * Permite al usuario extender su sesión o cerrarla de forma segura
 * Proporciona feedback visual con timer y barra de progreso
 * Refuerza la seguridad y la experiencia de usuario ante la expiración
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Props del modal de advertencia de expiración de sesión
 * Define la interfaz para controlar el comportamiento del modal
 */
interface SessionExpiryWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
}

/**
 * Componente modal que advierte sobre la expiración inminente de sesión
 * Proporciona opciones para extender la sesión o cerrarla de forma segura
 * Incluye timer visual, barra de progreso y manejo de estados de carga
 */
export const SessionExpiryWarningModal: React.FC<SessionExpiryWarningModalProps> = ({
  isOpen,
  onContinue,
  onClose
}) => {
  const { data: _session } = useSession();
  // Estado para el tiempo restante (en segundos)
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  // Estado para controlar si se está procesando una acción
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  /**
   * Maneja el timer de expiración de sesión
   * Se ejecuta cada segundo y cierra el modal cuando llega a 0
   * Reinicia el timer cuando el modal se cierra
   */
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300); // Reiniciar timer cuando se cierra el modal
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onClose(); // Cerrar modal de advertencia cuando se agota el tiempo
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  /**
   * Extiende la sesión del usuario
   * Llama a la función onContinue para renovar el token
   * Maneja errores y proporciona feedback al usuario
   */
  const handleContinueSession = async () => {
    setIsProcessing(true);
    try {
      // Extender sesión aquí - la implementación depende del método de autenticación
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

  /**
   * Maneja el cierre de sesión seguro
   * Limpia los datos locales y redirige al login
   * Garantiza que no queden datos sensibles en el navegador
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
      signOut({ callbackUrl: '/login' });
    }
  };

  /**
   * Formatea el tiempo restante en formato MM:SS
   * @param seconds - Segundos restantes
   * @returns String formateado del tiempo
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular porcentaje de progreso para la barra visual
  const progressPercentage = (timeLeft / 300) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl">
        {/* Barra de progreso que muestra el tiempo restante */}
        <div className="h-1 bg-muted w-full">
          <div 
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="p-6">
          {/* Encabezado con icono de advertencia */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold">
              Sesión a punto de expirar
            </h2>
          </div>
          
          {/* Mensaje explicativo con contador de tiempo */}
          <div className="text-muted-foreground text-sm mb-6 space-y-3">
            <p>
              Su sesión expirará en breve debido a inactividad. Por motivos de seguridad, será redirigido a la página de inicio de sesión.
            </p>
            
            {/* Contador de tiempo con icono */}
            <div className="flex items-center space-x-2 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span>Tiempo restante: <span className="font-bold">{formatTime(timeLeft)}</span></span>
            </div>
          </div>
          
          {/* Botones de acción para cerrar sesión o continuar */}
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
