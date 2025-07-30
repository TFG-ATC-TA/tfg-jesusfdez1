/**
 * Servicio para funcionalidades de Daniel López
 * Maneja operaciones de datos históricos, tiempo real y predicciones
 * Proporciona hooks personalizados para gestión de estado
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
 * Servicio principal para operaciones de Daniel
 * Proporciona métodos para datos históricos, tiempo real y predicciones
 * Utiliza fetch API para comunicación con el backend
 */
export const DanielService = {
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

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}/history/historicalData`;
    console.log('=== API Call Details ===');
    console.log('Base URL:', baseUrl);
    console.log('Full URL:', url);
    console.log('Params:', params);
    console.log('Headers:', headers);
    console.log('Token available:', !!token);
    console.log('Token length:', token ? token.length : 0);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      console.log('=== Response Details ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        
        try {
          errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response as JSON, using status text');
          errorMessage = response.statusText || errorMessage;
        }
        
        // Log specific error details
        console.error('=== HTTP Error Details ===');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Error Data:', errorData);
        console.error('Final Error Message:', errorMessage);
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('=== Success Response ===');
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result));
      console.log('Result data:', result);
      
      // Si el resultado tiene un campo data null, significa que no hay datos
      if (result.data === null) {
        console.log('Data field is null, returning empty object');
        return {};
      }
      
      return result;
    } catch (error) {
      console.error('=== API Call Error ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
      } else if (error instanceof Error) {
        // Ensure the error message is not undefined
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictTankState`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictTankState/real-time`, {
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cache/${farmId}/${boardId}`, {
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

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/postgres/farm-activities`);
    
    // Añadir parámetros de consulta
    if (params.page !== undefined) url.searchParams.append('page', params.page.toString());
    if (params.daysPerPage !== undefined) url.searchParams.append('daysPerPage', params.daysPerPage.toString());
    if (params.bucket) url.searchParams.append('bucket', params.bucket);
    if (params.startDate) url.searchParams.append('startDate', params.startDate);
    if (params.endDate) url.searchParams.append('endDate', params.endDate);

    console.log('=== Fetching Farm Activities ===');
    console.log('URL:', url.toString());
    console.log('Params:', params);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('=== Farm Activities Response ===');
    console.log('Raw response:', result);
    
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

    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/postgres/tank-activities`);
    
    // Añadir parámetros de consulta
    if (params.bucket) url.searchParams.append('bucket', params.bucket);
    if (params.startDate) url.searchParams.append('startDate', params.startDate);

    console.log('=== Fetching Tank Activities ===');
    console.log('URL:', url.toString());
    console.log('Params:', params);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('=== Tank Activities Response ===');
    console.log('Raw response:', result);
    
    return result;
  },
};

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
 * Hook para gestionar datos históricos
 * Proporciona estado y métodos para cargar datos históricos
 * Adaptado del proyecto tfg-DaniLopez23
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

      console.log('=== Fetching Historical Data ===');
      console.log('Params:', params);
      console.log('Token available:', !!token);

      const data = await DanielService.getHistoricalData(params, token);

      console.log('=== Historical Data Response ===');
      console.log('Raw data received:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('Data length:', Object.keys(data).length);

      if (!data || Object.keys(data).length === 0) {
        setHistoricalData(null);
        setError("No historical data found for the selected filters.");
        return;
      }

      // Log sample data for debugging
      const timeKeys = Object.keys(data);
      if (timeKeys.length > 0) {
        const firstTime = timeKeys[0];
        console.log('Sample data for time', firstTime, ':', data[firstTime]);
        
        // Log all available measurements
        const measurements = Object.keys(data[firstTime]);
        console.log('Available measurements:', measurements);
        
        measurements.forEach(measurement => {
          console.log(`Measurement ${measurement}:`, data[firstTime][measurement]);
        });
      }

      setHistoricalData(data);
    } catch (err) {
      console.error('=== Hook Error Details ===');
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
      
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
      
      console.error('Final error message to display:', errorMessage);
      
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
      `ws://${process.env.NEXT_PUBLIC_API_URL?.replace('http://', '')}/realtime/data?from=${farmId}&info=${boardId}&token=${token}`
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
      const result = await DanielService.getTankStatePrediction(params, token);
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
      const result = await DanielService.getRealTimePrediction(params, token);
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
      const data = await DanielService.getCachedData(farmId, boardId, token);
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
  const [farmActivities, setFarmActivities] = useState<FarmActivitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFarmActivities = async (params: FarmActivitiesParams, token?: string) => {
    try {
    setLoading(true);
    setError(null);

      console.log('=== Loading Farm Activities ===');
      console.log('Params:', params);
      console.log('Token available:', !!token);

      const data = await DanielService.getFarmActivities(params, token);
      
      console.log('=== Farm Activities Data ===');
      console.log('Success:', data.success);
      console.log('Summary:', data.summary);
      console.log('Timeline length:', data.timeline?.length);
      console.log('Raw stats keys:', Object.keys(data.rawStats || {}));

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
      
      console.log('=== Loading Tank Activities ===');
      console.log('Params:', params);
      console.log('Token available:', !!token);

      const data = await DanielService.getTankActivities(params, token);
      
      console.log('=== Tank Activities Data ===');
      console.log('Activities count:', data?.length);
      console.log('Activities:', data);

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