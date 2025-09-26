/**
 * Servicio principal para gestión de datos y usuarios
 * Maneja operaciones de datos históricos, tiempo real, predicciones y usuarios
 * Proporciona hooks personalizados para gestión de estado
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

/**
 * Interfaz para datos de granja
 */
export interface Farm {
  _id: string;
  name: string;
  idname: string;
  location: string;
}

/**
 * Interfaz para datos históricos
 */
export interface HistoricalData {
  [time: string]: {
    [key: string]: {
      measurement: string;
      tags: {
        board_id: string;
        sensor_id: string;
      };
      readableDate: string;
      value: any;
    };
  };
}

/**
 * Interfaz para datos en tiempo real
 */
export interface RealTimeData {
  topic: string;
  payload: any;
  processedData?: any;
}

/**
 * Interfaz para predicciones de estado del tanque
 */
export interface TankStatePrediction {
  farm: string;
  boardIds: string[];
  date: string;
  predictions: {
    [time: string]: {
      state: string;
      confidence: number;
    };
  };
}

/**
 * Parámetros para consulta de datos históricos
 */
export interface HistoricalDataParams {
  farm: string;
  date: string;
  boardIds: string[];
  tank?: {
    height: number;
  };
}

/**
 * Parámetros para predicción de estado del tanque
 */
export interface PredictionParams {
  farm: string;
  boardIds: string[];
  date: string;
  tank?: {
    height: number;
  };
}

/**
 * Interfaz principal para usuarios del sistema
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
 * Tipo para datos de usuario actualizados
 */
export type UserProfileUpdate = {
  name?: string;
  surname?: string;
  email?: string;
  token?: string;
  role?: string;
};

/**
 * Respuesta paginada de la lista de usuarios
 */
export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Parámetros de consulta para filtrar usuarios
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: string;
}

export interface FarmActivitiesParams {
  page?: number;
  daysPerPage?: number;
  startDate?: string;
  endDate?: string;
  bucket?: string;
}

export interface TankStateInterval {
  start_time: string;
  end_time: string;
  state: string;
}

export interface FarmActivitiesResponse {
  success: boolean;
  summary: {
    numCycles: number;
    avgDurationCycles: string;
    numMilkings: number;
    avgDurationMilkings: string;
    numAgitations: number;
    numEmptyings: number;
    numWashings: number;
    coolingRate: string;
  };
  timeline: Array<{
    id: string;
    schedule: Array<{
      start: string;
      end: string;
      day: number;
      date?: string;
    }>;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    daysPerPage: number;
    totalDays: number;
    visibleDates: string[];
  };
  rawStats: {
    [state: string]: {
      count: number;
      totalDuration: number;
      intervals: Array<{
        start: string;
        end: string;
        duration: number;
      }>;
    };
  };
}

export interface TankActivitiesParams {
  startDate?: string;
  bucket?: string;
}

export interface TankActivity {
  startTime: string;
  endTime: string;
  state: string;
}

export interface TankActivitiesResponse extends Array<TankActivity> {}

/**
 * Servicio principal para operaciones de datos
 * Proporciona métodos para datos históricos, tiempo real, predicciones, usuarios y más
 * Utiliza fetch API para comunicación con el backend
 */
export const DataService = {
  /**
   * Obtiene datos históricos de InfluxDB
   * @param params - Parámetros de consulta
   * @param token - Token de autenticación
   * @returns Promise con datos históricos
   */
  async getHistoricalData(params: HistoricalDataParams, token?: string): Promise<HistoricalData> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const url = `${baseUrl}/history/historicalData`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Si el resultado tiene un campo data null, significa que no hay datos
      if (result.data === null) {
        return {};
      }
      
      return result;
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
      } else if (error instanceof Error) {
        const message = error.message || 'Error desconocido al cargar datos históricos';
        throw new Error(message);
      } else if (typeof error === 'string') {
        throw new Error(error);
      } else if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String((error as any).message));
      } else {
        throw new Error('Error desconocido al cargar datos históricos');
      }
    }
  },

  /**
   * Obtiene predicción de estado del tanque
   * @param params - Parámetros de predicción
   * @param token - Token de autenticación
   * @returns Promise con predicciones
   */
  async getTankStatePrediction(params: PredictionParams, token?: string): Promise<TankStatePrediction> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/predictTankState`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene predicción en tiempo real del estado del tanque
   * @param params - Parámetros de predicción
   * @param token - Token de autenticación
   * @returns Promise con predicción en tiempo real
   */
  async getRealTimePrediction(params: PredictionParams, token?: string): Promise<TankStatePrediction> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/predictTankState/real-time`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene datos del caché para un board específico
   * @param farmId - ID de la granja
   * @param boardId - ID del board
   * @param token - Token de autenticación
   * @returns Promise con datos del caché
   */
  async getCachedData(farmId: string, boardId: string, token?: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/cache/${farmId}/${boardId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Obtiene los estados del tanque desde el endpoint farm-activities
   * @param params - Parámetros de consulta
   * @param token - Token de autenticación
   * @returns Promise con los estados del tanque
   */
  async getFarmActivities(params: FarmActivitiesParams, token?: string): Promise<FarmActivitiesResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/postgres/farm-activities`);
    
    // Añadir parámetros de consulta
    if (params.page !== undefined) url.searchParams.append('page', params.page.toString());
    if (params.daysPerPage !== undefined) url.searchParams.append('daysPerPage', params.daysPerPage.toString());
    if (params.bucket) url.searchParams.append('bucket', params.bucket);
    if (params.startDate) url.searchParams.append('startDate', params.startDate);
    if (params.endDate) url.searchParams.append('endDate', params.endDate);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  },

  /**
   * Obtiene las actividades del tanque de forma simple
   * @param params - Parámetros de consulta
   * @param token - Token de autenticación
   * @returns Promise con las actividades del tanque
   */
  async getTankActivities(params: TankActivitiesParams, token?: string): Promise<TankActivitiesResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/postgres/tank-activities`);
    
    // Añadir parámetros de consulta
    if (params.bucket) url.searchParams.append('bucket', params.bucket);
    if (params.startDate) url.searchParams.append('startDate', params.startDate);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  },

  /**
   * Obtiene lista paginada de usuarios
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

/**
 * Hook para gestionar datos históricos
 * Proporciona estado y métodos para cargar datos históricos
 */
export function useHistoricalData() {
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [selectedHistoricalData, setSelectedHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert time string (HH:MM) to minutes
  const timeStringToMinutes = useCallback((timeString: string) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }, []);

  const updateSelectedHistoricalData = useCallback((data: HistoricalData, timeString: string) => {
    if (!data || !timeString) return;

    // Check if the exact time exists in the data
    if (data[timeString]) {
      setSelectedHistoricalData(data[timeString]);
      return;
    }

    // If exact time doesn't exist, find the closest available time
    const times = Object.keys(data);
    if (times.length > 0) {
      // Convert all times to minutes for comparison
      const targetMinutes = timeStringToMinutes(timeString);

      // Find the closest time
      let closestTime = times[0];
      let minDifference = Math.abs(
        timeStringToMinutes(closestTime) - targetMinutes
      );

      times.forEach((time) => {
        const difference = Math.abs(timeStringToMinutes(time) - targetMinutes);
        if (difference < minDifference) {
          closestTime = time;
          minDifference = difference;
        }
      });

      setSelectedHistoricalData(data[closestTime]);
    } else {
      setSelectedHistoricalData(null);
    }
  }, [timeStringToMinutes]);

  const fetchHistoricalData = useCallback(async (params: HistoricalDataParams, token?: string) => {
    if (!params.farm || !params.date || !params.boardIds || params.boardIds.length === 0) {
      logger.warn("Missing required parameters for fetching historical data");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await DataService.getHistoricalData(params, token);

      if (!data || Object.keys(data).length === 0) {
        setHistoricalData(null);
        setError("No historical data found for the selected filters.");
        return;
      }

      setHistoricalData(data);
    } catch (err) {
      // Ensure we always have a clear error message
      let errorMessage = 'Error desconocido al cargar datos históricos';
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as any).message);
      } else if (err && typeof err === 'object' && 'error' in err) {
        errorMessage = String((err as any).error);
      }
      
      setHistoricalData(null);
      setError(errorMessage);
      logger.error('Error loading historical data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTimeSelected = useCallback(
    (timeString: string) => {
      if (!timeString) return;

      if (historicalData && !loading) {
        updateSelectedHistoricalData(historicalData, timeString);
      } else {
        // Reset selected data if we don't have historical data yet
        setSelectedHistoricalData(null);
      }
    },
    [historicalData, loading, updateSelectedHistoricalData]
  );

  return {
    historicalData,
    selectedHistoricalData,
    loading,
    error,
    fetchHistoricalData,
    handleTimeSelected,
    setSelectedHistoricalData,
    setHistoricalData
  };
}

/**
 * Hook para gestionar datos en tiempo real via WebSocket
 * Proporciona estado y métodos para conexión WebSocket
 */
export function useRealTimeData(farmId: string, boardId: string, token?: string) {
  const [data, setData] = useState<RealTimeData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Memoizar los parámetros para evitar re-crear conexiones innecesariamente
  const connectionParams = useMemo(() => ({
    farmId,
    boardId,
    token
  }), [farmId, boardId, token]);

  useEffect(() => {
    const { farmId, boardId, token } = connectionParams;
    
    if (!farmId || !boardId || !token) {
      // Limpiar datos si no hay parámetros válidos
      setData([]);
      setIsConnected(false);
      setError(null);
      return;
    }

    // Cerrar conexión anterior si existe
    if (wsRef.current) {
      logger.log('Closing previous WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    logger.log('Creating new WebSocket connection:', { farmId, boardId });
    const ws = new WebSocket(
      `ws://${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace('http://', '')}/realtime/data?from=${farmId}&info=${boardId}&token=${token}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      logger.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const messageData: RealTimeData = JSON.parse(event.data);
        setData(prev => [messageData, ...prev.slice(0, 19)]); // Mantener solo los últimos 20
      } catch (err) {
        logger.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      logger.log('WebSocket disconnected');
    };

    ws.onerror = (err) => {
      setIsConnected(false);
      setError('Error de conexión WebSocket');
      logger.error('WebSocket error:', err);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectionParams]);

  return {
    data,
    isConnected,
    error,
  };
}

/**
 * Hook para gestionar predicciones de estado del tanque
 * Proporciona estado y métodos para cargar predicciones
 */
export function useTankStatePrediction() {
  const [prediction, setPrediction] = useState<TankStatePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrediction = async (params: PredictionParams, token?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await DataService.getTankStatePrediction(params, token);
      setPrediction(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      logger.error('Error loading tank state prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimePrediction = async (params: PredictionParams, token?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await DataService.getRealTimePrediction(params, token);
      setPrediction(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      logger.error('Error loading real-time prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    prediction,
    loading,
    error,
    loadPrediction,
    loadRealTimePrediction,
  };
}

/**
 * Hook para gestionar datos del caché
 * Proporciona estado y métodos para cargar datos del caché
 */
export function useCachedData() {
  const [cachedData, setCachedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCachedData = async (farmId: string, boardId: string, token?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await DataService.getCachedData(farmId, boardId, token);
      setCachedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      logger.error('Error loading cached data:', err);
    } finally {
      setLoading(false);
    }
  };

  return { cachedData, loading, error, loadCachedData };
}

/**
 * Hook para obtener los estados del tanque desde farm-activities
 */
export function useFarmActivities() {
  const { data: session } = useSession();
  const [farmActivities, setFarmActivities] = useState<FarmActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFarmActivities = async (params: FarmActivitiesParams, token?: string) => {
    const authToken = token || session?.accessToken;
    try {
    setLoading(true);
    setError(null);

      const data = await DataService.getFarmActivities(params, authToken);
      
      setFarmActivities(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setFarmActivities(null);
      setError(errorMessage);
      logger.error('Error loading farm activities:', err);
    } finally {
      setLoading(false);
    }
  };

  return { farmActivities, loading, error, loadFarmActivities };
} 

/**
 * Hook para obtener las actividades del tanque
 */
export function useTankActivities() {
  const [tankActivities, setTankActivities] = useState<TankActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTankActivities = async (params: TankActivitiesParams, token?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await DataService.getTankActivities(params, token);
      
      setTankActivities(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setTankActivities(null);
      setError(errorMessage);
      logger.error('Error loading tank activities:', err);
    } finally {
      setLoading(false);
    }
  };

  return { tankActivities, loading, error, loadTankActivities };
} 

// Clave para almacenar los datos de usuario en localStorage
const USER_DATA_KEY = 'lactokeeper-user-data';

/**
 * Obtiene datos de usuario almacenados en localStorage
 * @returns Datos del usuario o null si no existen
 */
export const getUserLocalData = (): UserProfileUpdate | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Error al leer datos de usuario del localStorage:', error);
    return null;
  }
};

/**
 * Guarda datos de usuario en localStorage
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
    logger.error('Error al guardar datos de usuario en localStorage:', error);
  }
};

/**
 * Hook personalizado para suscribirse a actualizaciones del perfil de usuario
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