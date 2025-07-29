/**
 * Servicio para funcionalidades de Daniel López
 * Maneja operaciones de datos históricos, tiempo real y predicciones
 * Proporciona hooks personalizados para gestión de estado
 */

'use client';

import { useState, useEffect } from 'react';
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
      headers['Authorization'] = token;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/historicalData`, {
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
      headers['Authorization'] = token;
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
      headers['Authorization'] = token;
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
      headers['Authorization'] = token;
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
 */
export function useHistoricalData() {
  const [data, setData] = useState<HistoricalData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (params: HistoricalDataParams, token?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await DanielService.getHistoricalData(params, token);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      logger.error('Error loading historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    loadData,
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

  useEffect(() => {
    if (!farmId || !boardId || !token) return;

    const ws = new WebSocket(
      `ws://${process.env.NEXT_PUBLIC_API_URL?.replace('http://', '')}/realtime/data?from=${farmId}&info=${boardId}&token=${token}`
    );

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
      ws.close();
    };
  }, [farmId, boardId, token]);

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