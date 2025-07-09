'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type UserDetails = {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  permissions: string[];
};

type UserContextType = {
  user: UserDetails | null;
  updateUser: (newData: Partial<UserDetails>) => void;
  isLoading: boolean;
  isGanadero: boolean;
  isAdmin: boolean;
  isVeterinario: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Función para obtener permisos basados en el rol
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update, status } = useSession();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar el estado del usuario desde la sesión
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

  // Función para actualizar el usuario en el contexto y en next-auth
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

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser utilizado dentro de un UserProvider');
  }
  return context;
}

// Alias para mantener compatibilidad
export const useUserContext = useUser;