'use client';

import { useState, useEffect } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Settings, LogOut } from 'lucide-react';
import { SettingsModal } from '../modals/settings-modal';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';
import { useUserProfileUpdates, UserProfileUpdate, getUserLocalData } from '@/services/user-service';

type UserNavProps = {
  isMinimized: boolean;
};

export function UserNav({ isMinimized }: UserNavProps) {
  const { data: session } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    surname: '',
    email: '',
    role: ''
  });

  // Inicializar datos de usuario con prioridad al localStorage sobre la sesión
  useEffect(() => {
    const localData = getUserLocalData();
    
    if (localData) {
      // Si hay datos en localStorage, tienen prioridad
      setUserData(prev => ({
        ...prev,
        name: localData.name || prev.name,
        surname: localData.surname || prev.surname,
        email: localData.email || prev.email,
        role: localData.role || prev.role
      }));
    } else if (session?.user) {
      // Si no hay datos en localStorage, usar los de la sesión
      setUserData({
        name: session.user.name || '',
        surname: session.user.surname || '',
        email: session.user.email || '',
        role: session.user.role || ''
      });
    }
  }, [session]);

  // Suscribirse a actualizaciones del perfil de usuario
  useUserProfileUpdates((updatedData: UserProfileUpdate) => {
    setUserData(prev => ({
      ...prev,
      ...updatedData
    }));
  });

  // También escuchar el evento user-data-changed para actualizaciones directas
  useEffect(() => {
    const handleUserDataChanged = (event: CustomEvent<UserProfileUpdate>) => {
      setUserData(prev => ({
        ...prev,
        ...event.detail
      }));
    };

    window.addEventListener(
      'user-data-changed',
      handleUserDataChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        'user-data-changed',
        handleUserDataChanged as EventListener
      );
    };
  }, []);

  // Función personalizada para manejar el cierre de sesión
  const handleSignOut = () => {
    // Limpiar localStorage antes de cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lactokeeper-user-data');
    }
    
    // Llamar a signOut de next-auth
    signOut();
  };

  if (!session) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center w-full p-2 rounded-md border-2 border-input hover:bg-accent hover:text-accent-foreground bg-white dark:bg-gray-800 dark:text-white",
            isMinimized ? "justify-center" : "justify-start"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage
                alt={userData.name}
              />
              <AvatarFallback>
                {userData.name?.[0]}
              </AvatarFallback>
            </Avatar>
            {!isMinimized && (
              <span className="ml-3 truncate text-md font-semibold">
                {`${userData.name} ${userData.surname}`}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("mt-2", {
            "ml-10": !isMinimized,
            "ml-[4.5rem]": isMinimized,
          })}
          align="end"
          forceMount
        >
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium leading-none">
                {userData.email}
              </p>
              <Badge
                className="text-xs leading-none pointer-events-none"
                style={{ backgroundColor: roleColors[userData.role], color: 'white' }}
              >
              {userData.role}
            </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

