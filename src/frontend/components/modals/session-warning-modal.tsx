'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from "framer-motion";

interface SessionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  onClose
}) => {
  // Constants
  const COUNTDOWN_FROM = 5; // 5 seconds countdown
  
  // State
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  
  // Reset and start countdown when modal opens
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

  // Calculate progress percentage
  const progressPercentage = (countdown / COUNTDOWN_FROM) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl [&>button]:hidden"
      >
        {/* Progress bar */}
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
          
          {/* Message - Updated with more accurate information */}
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
          
          {/* Action button */}
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
