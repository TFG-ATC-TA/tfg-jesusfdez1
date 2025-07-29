/**
 * Componente de barra lateral (sidebar)
 * Maneja la navegación principal y el estado de minimización del menú
 */

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { navItems } from '@/constants/data';
import { UserNav } from '@/components/layout/user-nav';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { DanielService } from '@/services/daniel-service';

/**
 * Props del componente Sidebar
 */
type SidebarProps = {
  className?: string;
};

/**
 * Función para obtener el color del estado del tanque
 */
const getTankStateColor = (state: string) => {
  switch (state.toUpperCase()) {
    case 'MILKING':
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    case 'COOLING':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'CLEANING':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    case 'MAINTENANCE':
      return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
    case 'EMPTY TANK':
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    default:
      return 'border-gray-300 bg-card';
  }
};

/**
 * Función para obtener el estado actual del tanque basado en la hora
 */
const getCurrentTankState = (activities: any[], currentTime: Date) => {
  if (!activities || activities.length === 0) return null;

  const currentTimeStr = currentTime.toISOString();
  
  for (const activity of activities) {
    if (currentTimeStr >= activity.startTime && currentTimeStr <= activity.endTime) {
      return activity.state;
    }
  }
  
  return null;
};

/**
 * Componente principal del sidebar
 * Renderiza la navegación lateral con logo, menú y perfil de usuario
 * @param className - Clases CSS adicionales
 */
export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession();
  const { isMinimized, toggle } = useSidebar();
  const pathname = usePathname();
  const [currentTankState, setCurrentTankState] = useState<string | null>(null);
  const [tankActivities, setTankActivities] = useState<any[]>([]);

  // Obtener las actividades del tanque para la fecha actual
  useEffect(() => {
    const fetchTankActivities = async () => {
      try {
        console.log('=== Sidebar: Fetching Tank Activities ===');
        const today = new Date().toISOString().split('T')[0];
        const activities = await DanielService.getTankActivities({
          startDate: today,
          bucket: 'synthetic-farm-1'
        });
        
        console.log('=== Sidebar: Activities Received ===');
        console.log('Activities count:', activities?.length);
        console.log('Activities:', activities);
        
        setTankActivities(activities || []);
      } catch (error) {
        console.error('Error fetching tank activities:', error);
      }
    };

    fetchTankActivities();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Actualizar el estado actual cada minuto
  useEffect(() => {
    const updateCurrentState = () => {
      const currentState = getCurrentTankState(tankActivities, new Date());
      console.log('=== Sidebar: Current Tank State ===');
      console.log('Current state:', currentState);
      console.log('Activities available:', tankActivities.length);
      setCurrentTankState(currentState);
    };

    // Actualizar inmediatamente
    updateCurrentState();
    
    // Actualizar cada minuto
    const interval = setInterval(updateCurrentState, 60000);

    return () => clearInterval(interval);
  }, [tankActivities]); // Se ejecuta cuando cambian las actividades

  // Obtener el color del estado actual
  const sidebarColorClass = currentTankState ? getTankStateColor(currentTankState) : 'border-gray-300 bg-card';

  return (
    <aside
      className={cn(
        `relative hidden h-screen flex-none border-r transition-all duration-300 ease-in-out md:flex md:flex-col z-30`,
        `border-l-4 ${sidebarColorClass}`,
        !isMinimized ? 'w-64' : 'w-20',
        className
      )}
    >
      {/* Header del sidebar con logo y botón de toggle */}
      <div className={cn(
        "flex items-center",
        isMinimized 
          ? "justify-center px-3 pt-7 pb-3" 
          : "justify-between px-6 pt-7 pb-4"
      )}>
        <Link href="/" className={cn("flex items-center justify-center", isMinimized ? "w-full ml-1" : "")}>
          <Image
            src="/logo.svg"
            alt="LactoKeeper Logo"
            width="50"
            height="50"
            className="text-primary dark:opacity-80"
          />
          {!isMinimized && (
            <span className="font-['LT_Saeada'] text-2xl text-foreground flex flex-col items-center leading-none ml-4">
              LACTO
              <span className="text-primary">KEEPER</span>
            </span>
          )}
        </Link>
        {!isMinimized && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Botón de toggle cuando está minimizado */}
      {isMinimized && (
        <div className="flex justify-center mt-2 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
      
      {/* Navegación principal */}
      <div className="flex-grow py-6 flex flex-col px-3">
        <nav className="space-y-3">
          {/* Filtrar elementos de navegación según el rol del usuario */}
          {navItems
            .filter(item => item.roles.includes(session?.user?.role ?? ''))
            .map((item) => (
              <Link key={item.name} href={item.href} className="block">
               <Button variant="outline"
                  className={cn(
                    "w-full justify-start hover:bg-primary hover:text-primary-foreground ",
                    pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : ' dark:bg-gray-800  dark:text-white',
                    isMinimized ? "px-4" : "px-6")}
                  title={item.description}>
                  <item.icon className={cn("h-5 w-5", !isMinimized && "mr-3")} />
                  {!isMinimized && <span>{item.name}</span>}
                </Button>
              </Link>
            ))}
        </nav>
      </div>
      
      {/* Perfil de usuario en la parte inferior */}
      <div className="px-3 py-2 mb-3">
        <UserNav isMinimized={isMinimized} />
      </div>
    </aside>
  );
}