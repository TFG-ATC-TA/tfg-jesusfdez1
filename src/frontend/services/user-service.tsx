/**
 * Servicio de usuarios para la aplicación frontend
 * Maneja operaciones CRUD de usuarios y gestión de sesiones
 * Proporciona hooks personalizados para gestión de estado y persistencia local
 */

'use client';

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Tipo para datos de usuario actualizados
 * Se usa para actualizar información del perfil
 * Permite actualizaciones parciales de los campos del usuario
 */
export type UserProfileUpdate = {
  name?: string;
  surname?: string;
  email?: string;
  token?: string;
  role?: string;
};

/**
 * Interfaz principal para usuarios del sistema
 * Define la estructura de datos de un usuario
 * Incluye campos obligatorios y opcionales con tipos específicos
 */
export interface User {
  id: string;
  name: string;
  surname?: string;
  email: string;
  role: 'Ganadero' | 'Administrador' | 'Veterinario';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Respuesta paginada de la lista de usuarios
 * Incluye datos, total de elementos y información de paginación
 * Facilita la implementación de tablas con paginación
 */
export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Parámetros de consulta para filtrar usuarios
 * Permite búsqueda, paginación y filtrado por rol
 * Todos los parámetros son opcionales para flexibilidad
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: string;
}

/**
 * Servicio principal para operaciones de usuarios
 * Proporciona métodos para CRUD de usuarios con manejo de errores
 * Utiliza fetch API para comunicación con el backend
 */
export const UserService = {
  /**
   * Obtiene lista paginada de usuarios
   * Construye parámetros de consulta dinámicamente
   * @param params - Parámetros de consulta (paginación, búsqueda, filtros)
   * @returns Promise con respuesta paginada
   */
  async getUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.searchTerm) searchParams.append('searchTerm', params.searchTerm);
    if (params.role) searchParams.append('role', params.role);

    const response = await fetch(`/api/user/list?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Obtiene un usuario específico por ID
   * @param id - ID del usuario a obtener
   * @returns Promise con datos del usuario
   */
  async getUserById(id: string): Promise<User> {
    const response = await fetch(`/api/user/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Promise con el usuario creado
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Actualiza un usuario existente
   * @param id - ID del usuario a actualizar
   * @param userData - Datos actualizados del usuario
   * @returns Promise con el usuario actualizado
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await fetch(`/api/user/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Elimina un usuario
   * @param id - ID del usuario a eliminar
   * @returns Promise que se resuelve cuando se completa la eliminación
   */
  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`/api/user/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};

// Clave para almacenar los datos de usuario en localStorage
const USER_DATA_KEY = 'lactokeeper-user-data';

/**
 * Obtiene datos de usuario almacenados en localStorage
 * Maneja errores de parsing y verifica disponibilidad del objeto window
 * @returns Datos del usuario o null si no existen
 */
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

/**
 * Guarda datos de usuario en localStorage
 * Combina datos existentes con nuevos datos para actualizaciones parciales
 * @param data - Datos del usuario a guardar
 */
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

/**
 * Hook personalizado para suscribirse a actualizaciones del perfil de usuario
 * Utiliza eventos personalizados para comunicación entre componentes
 * @param callback - Función que se ejecuta cuando se actualiza el perfil
 */
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

/**
 * Hook para actualizar automáticamente la sesión cuando cambia el perfil
 * Maneja la sincronización entre sesión y localStorage
 * Proporciona persistencia de datos entre recargas de página
 */
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

  /**
   * Suscribirse a actualizaciones del perfil y sincronizar con la sesión
   * Actualiza tanto la sesión de NextAuth como el localStorage
   */
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
        
        logger.log('Sesión actualizada con éxito', userData);
      } catch (error) {
        logger.error('Error al actualizar la sesión:', error);
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

/**
 * Helper para notificar cambios en el perfil de usuario
 * Guarda datos en localStorage y dispara eventos para sincronización
 * @param data - Datos del usuario actualizados
 */
export function notifyProfileUpdate(data: UserProfileUpdate) {
  // Guardar inmediatamente en localStorage
  saveUserLocalData(data);
  
  // Disparar evento para componentes que están escuchando
  const event = new CustomEvent('user-profile-updated', {
    detail: data
  });
  window.dispatchEvent(event);
}