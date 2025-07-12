/**
 * Contexto de usuario para la aplicación
 * Maneja el estado global del usuario autenticado y sus permisos
 * Proporciona acceso centralizado a información del usuario y roles
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Tipo para los detalles completos del usuario
 * Incluye información personal y permisos del sistema
 * Define la estructura completa de datos del usuario autenticado
 */
type UserDetails = {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  permissions: string[];
};

/**
 * Tipo para el contexto de usuario
 * Define la interfaz del contexto con estado y métodos
 * Incluye helpers booleanos para verificación de roles
 */
type UserContextType = {
  user: UserDetails | null;
  updateUser: (newData: Partial<UserDetails>) => void;
  isLoading: boolean;
  isGanadero: boolean;
  isAdmin: boolean;
  isVeterinario: boolean;
};

// Crear el contexto de React
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Función para obtener permisos basados en el rol del usuario
 * Define permisos específicos para cada rol del sistema
 * @param role - Rol del usuario (Ganadero, Administrador, Veterinario)
 * @returns Array de permisos asociados al rol
 */
function getPermissionsByRole(role: string): string[] {
  switch (role) {
    case 'Ganadero':
      return ['farm_management', 'device_monitoring'];
    case 'Administrador':
      return ['user_management', 'system_config', 'farm_management', 'device_monitoring', 'medical_records', 'consultations'];
    case 'Veterinario':
      return ['medical_records', 'consultations'];
    default:
      return [];
  }
}

/**
 * Proveedor del contexto de usuario
 * Maneja la inicialización del estado y la sincronización con next-auth
 * Proporciona el contexto a toda la aplicación
 * @param children - Componentes hijos que tendrán acceso al contexto
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update, status } = useSession();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Inicializar el estado del usuario desde la sesión
   * Sincroniza datos de next-auth con el contexto local
   * Calcula permisos basados en el rol del usuario
   */
  useEffect(() => {
    if (session?.user) {
      const role = session.user.role;
      setUser({
        id: session.user.id,
        name: session.user.name,
        surname: session.user.surname,
        email: session.user.email,
        role: role,
        permissions: getPermissionsByRole(role),
      });
    }
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [session, status]);

  /**
   * Función para actualizar el usuario en el contexto y en next-auth
   * Permite actualizaciones parciales del perfil de usuario
   * Sincroniza cambios con la sesión de next-auth
   * @param newData - Datos parciales del usuario a actualizar
   */
  const updateUser = async (newData: Partial<UserDetails>) => {
    if (!user) return;

    // Actualizar el estado local inmediatamente
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);

    // Actualizar la sesión de next-auth si es posible
    if (session) {
      try {
        await update({
          ...session,
          user: {
            ...session.user,
            ...newData
          }
        });
      } catch (error) {
        console.error('Error al actualizar la sesión:', error);
      }
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      updateUser, 
      isLoading,
      isGanadero: user?.role === 'Ganadero',
      isAdmin: user?.role === 'Administrador', 
      isVeterinario: user?.role === 'Veterinario'
    }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook para usar el contexto de usuario
 * Proporciona acceso seguro al contexto de usuario
 * @returns Contexto de usuario con estado y métodos
 * @throws Error si se usa fuera del UserProvider
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser utilizado dentro de un UserProvider');
  }
  return context;
}

// Alias para mantener compatibilidad
export const useUserContext = useUser;