/**
 * Sidebar móvil para navegación en dispositivos móviles
 * Proporciona navegación con pestañas expandibles y menú de usuario
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LucideIcon, Settings, LogOut } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { SettingsModal } from '../modals/settings-modal';
import { navItems } from '@/constants/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';
import { useUserProfileUpdates, UserProfileUpdate, getUserLocalData } from '@/services/data-service';

/**
 * Props del componente MobileSidebar
 */
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Componente de sidebar móvil
 * Renderiza navegación con pestañas expandibles y perfil de usuario
 * Optimizado para dispositivos móviles con navegación táctil
 */
export function MobileSidebar({ }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    surname: '',
    email: '',
    role: ''
  });

  /**
   * Inicializar datos de usuario con prioridad al localStorage sobre la sesión
   * Permite persistencia de datos entre sesiones
   */
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

  /**
   * Suscribirse a actualizaciones del perfil de usuario
   * Actualiza los datos cuando se modifica el perfil
   */
  useUserProfileUpdates((updatedData: UserProfileUpdate) => {
    setUserData(prev => ({
      ...prev,
      ...updatedData
    }));
  });

  /**
   * Escuchar el evento user-data-changed para actualizaciones directas
   * Maneja cambios de datos desde otros componentes
   */
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

  /**
   * Función personalizada para manejar el cierre de sesión
   * Limpia localStorage y cierra la sesión de next-auth
   */
  const handleSignOut = () => {
    // Limpiar localStorage antes de cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lactokeeper-user-data');
    }
    
    // Llamar a signOut de next-auth
    signOut();
  };

  /**
   * Filtrar elementos de navegación según el rol del usuario
   * Solo muestra las opciones a las que tiene acceso
   */
  const tabs = navItems
    .filter(item => item.roles.includes(userData.role))
    .map(item => ({
      title: item.name,
      icon: item.icon as LucideIcon,
    }));

  /**
   * Determinar la pestaña activa basada en la ruta actual
   */
  const activeIndex = navItems.findIndex(item => pathname.startsWith(item.href));

  if (!session) return null;

  return (
    <>
      {/* Contenedor fijo en la parte inferior para navegación móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-80 pb-4 px-2 bg-gradient-to-t to-transparent">
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          {/* Pestañas expandibles para navegación principal */}
          <ExpandableTabs
            tabs={tabs}
            activeIndex={activeIndex}
            onChange={(index) => {
              if (index === null) return;
              const navItem = navItems[index];
              if (navItem?.href) {
                router.push(navItem.href);
              }
            }}
            className="flex-1 shadow-md dark:shadow-lg rounded-xl 
                     border-2 border-border dark:border-border/50 mb-4 
                     bg-background dark:bg-gray-800"
          />
          
          {/* Menú desplegable del usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-xl shadow-md dark:shadow-lg
                                border-2 border-border dark:border-border/50 
                                bg-background dark:bg-gray-800 mb-4
                                hover:bg-accent hover:text-accent-foreground
                                transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage alt={userData.name} />
                  <AvatarFallback>{userData.name?.[0]}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            
            {/* Contenido del menú desplegable */}
            <DropdownMenuContent align="end" className="w-64 mb-2">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium leading-none">
                    {userData.email}
                  </p>
                  {/* Badge con el rol del usuario */}
                  <Badge
                    className="text-xs leading-none pointer-events-none w-fit"
                    style={{ backgroundColor: roleColors[userData.role || 'defaultRole'], color: 'white' }}
                  >
                    {userData.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* Opción de configuración */}
                <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                {/* Opción de cerrar sesión */}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Modal de configuración */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
