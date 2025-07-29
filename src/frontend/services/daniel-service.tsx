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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/historicalData`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Si el resultado tiene un campo data null, significa que no hay datos
    if (result.data === null) {
      return {};
    }
    
    return result;
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/realtime/cache/${farmId}/${boardId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

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

      const data = await DanielService.getHistoricalData(params, token);

      if (!data || Object.keys(data).length === 0) {
        setHistoricalData(null);
        setError("No historical data found for the selected filters.");
        return;
      }

      setHistoricalData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCachedData = async (farmId: string, boardId: string, token?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await DanielService.getCachedData(farmId, boardId, token);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      logger.error('Error loading cached data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    loadCachedData,
  };
} 