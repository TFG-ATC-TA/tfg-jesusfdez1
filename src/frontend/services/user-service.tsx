'use client';

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

// Definición del tipo para los datos de usuario actualizados
export type UserProfileUpdate = {
  name?: string;
  surname?: string;
  email?: string;
  token?: string;
  role?: string;
};

// Clave para almacenar los datos de usuario en localStorage
const USER_DATA_KEY = 'lactokeeper-user-data';

// Funciones de utilidad para localStorage
export const getUserLocalData = (): UserProfileUpdate | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error al leer datos de usuario del localStorage:', error);
    return null;
  }
};

export const saveUserLocalData = (data: UserProfileUpdate): void => {
  if (typeof window === 'undefined') return;
  try {
    // Si solo hay campos parciales, combinamos con los datos existentes
    const existingData = getUserLocalData();
    const updatedData = existingData ? { ...existingData, ...data } : data;
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error al guardar datos de usuario en localStorage:', error);
  }
};

// Hook personalizado para suscribirse a actualizaciones del perfil de usuario
export function useUserProfileUpdates(callback: (data: UserProfileUpdate) => void) {
  useEffect(() => {
    // Función que maneja el evento de actualización del perfil
    const handleProfileUpdate = (event: CustomEvent<UserProfileUpdate>) => {
      callback(event.detail);
      // También guardar en localStorage para persistencia
      saveUserLocalData(event.detail);
    };

    // Suscribirse al evento personalizado
    window.addEventListener(
      'user-profile-updated',
      handleProfileUpdate as EventListener
    );

    // Limpiar el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener(
        'user-profile-updated',
        handleProfileUpdate as EventListener
      );
    };
  }, [callback]);
}

// Hook para actualizar automáticamente la sesión cuando cambia el perfil
export function useAutoSessionUpdate() {
  const { data: session, update } = useSession();

  // Guardar los datos de la sesión en localStorage cuando se inicia sesión
  useEffect(() => {
    if (session?.user && typeof window !== 'undefined') {
      // Verificar si ya existe información en localStorage
      const existingData = getUserLocalData();
      
      // Si no hay datos en localStorage o son diferentes, actualizar
      if (!existingData || existingData.role !== session.user.role) {
        saveUserLocalData({
          name: session.user.name,
          surname: session.user.surname,
          email: session.user.email,
          role: session.user.role,
        });
        
        // Disparar evento para actualizar UI
        const userUpdateEvent = new CustomEvent('user-data-changed', {
          detail: {
            name: session.user.name,
            surname: session.user.surname,
            email: session.user.email,
            role: session.user.role,
          }
        });
        window.dispatchEvent(userUpdateEvent);
      }
    }
  }, [session]);

  useUserProfileUpdates(async (userData) => {
    if (session) {
      try {
        // Actualizar la sesión de NextAuth con los nuevos datos
        await update({
          ...session,
          user: {
            ...session.user,
            ...userData
          },
          ...(userData.token ? { accessToken: userData.token } : {})
        });
        
        // También forzamos actualización del localStorage/DOM para los componentes que usan datos de usuario directo
        const userUpdateEvent = new CustomEvent('user-data-changed', {
          detail: userData
        });
        window.dispatchEvent(userUpdateEvent);
        
        console.log('Sesión actualizada con éxito', userData);
      } catch (error) {
        console.error('Error al actualizar la sesión:', error);
      }
    }
  });

  // Restaurar datos del usuario desde localStorage al iniciar (si existen)
  useEffect(() => {
    const localUserData = getUserLocalData();
    if (localUserData && session) {
      const event = new CustomEvent('user-data-changed', {
        detail: localUserData
      });
      window.dispatchEvent(event);
    }
  }, [session]);
}

// Helper para notificar cambios en el perfil de usuario
export function notifyProfileUpdate(data: UserProfileUpdate) {
  // Guardar inmediatamente en localStorage
  saveUserLocalData(data);
  
  // Disparar evento para componentes que están escuchando
  const event = new CustomEvent('user-profile-updated', {
    detail: data
  });
  window.dispatchEvent(event);
}