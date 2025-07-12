/**
 * Modal de advertencia de sesión
 * Se muestra antes de que expire la sesión del usuario
 * Incluye un countdown visual y permite al usuario extender su sesión
 * Proporciona una advertencia visual y sonora para evitar la expiración inesperada
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from 'lucide-react';

/**
 * Props del modal de advertencia de sesión
 * Define la interfaz para controlar el estado del modal
 */
interface SessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente modal de advertencia de sesión
 * Muestra un countdown y permite al usuario confirmar que ha visto la advertencia
 * Incluye barra de progreso y feedback visual
 */
export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  onClose
}) => {
  // Constantes para el countdown
  const COUNTDOWN_FROM = 5; // 5 segundos de countdown
  
  // Estado del countdown
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  
  /**
   * Reinicia y inicia el countdown cuando se abre el modal
   * El timer se ejecuta cada segundo hasta llegar a 0
   */
  useEffect(() => {
    if (!isOpen) {
      setCountdown(COUNTDOWN_FROM);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prevTime) => {
        const newTime = prevTime <= 1 ? 0 : prevTime - 1;
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);

  /**
   * Calcula el porcentaje de progreso para la barra visual
   * Proporciona feedback visual del tiempo restante
   */
  const progressPercentage = (countdown / COUNTDOWN_FROM) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl [&>button]:hidden"
      >
        {/* Barra de progreso visual */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 w-full">
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
              Aviso de sesión
            </h2>
          </div>
          
          {/* Mensaje de advertencia y countdown */}
          <div className="text-muted-foreground text-sm mb-6 space-y-3">
            <p>
              Su sesión está a punto de expirar. Por favor, guarde los cambios pendientes y ultime lo que está haciendo, ya que su sesión se cerrará automáticamente.
            </p>
            
            {/* Countdown timer */}
            <div className="flex items-center space-x-2 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span>Tiempo restante: <span className="font-bold">{countdown}</span> segundos</span>
            </div>
          </div>
          
          {/* Botón de acción para cerrar el modal */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
