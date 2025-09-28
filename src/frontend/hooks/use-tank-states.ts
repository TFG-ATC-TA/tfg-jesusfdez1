import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { DataService } from '@/services/data-service';
import { useSession } from 'next-auth/react';

interface TankStatesParams {
  filters: {
    selectedDate?: Date;
    dateRange?: { from: Date | undefined; to: Date | undefined } | null;
  };
  boardIds: string[];
  selectedFarm: string;
  selectedTank: string;
  mode?: string; // Agregar modo para verificar si es 'historical'
}

export interface TankState {
  startTime: string;
  endTime: string;
  state: string;
}

export interface TankStatesData {
  date: string;
  states: TankState[];
}

const useTankStates = ({ filters, boardIds, selectedFarm, selectedTank, mode }: TankStatesParams) => {
  const { data: session } = useSession();
  const [tankStates, setTankStates] = useState<TankStatesData | null>(null);
  const [tankStatesLoading, setTankStatesLoading] = useState(false);
  const [tankStatesError, setTankStatesError] = useState<string | null>(null);

  const fetchTankStates = useCallback(async () => {
    try {
      const dateToUse = filters.selectedDate || (filters.dateRange ? filters.dateRange.from : null);

      if (!dateToUse) {
        return;
      }

      if (!session?.accessToken) {
        return;
      }

      const formattedDate = format(new Date(dateToUse), "yyyy-MM-dd");

      setTankStatesLoading(true);
      setTankStatesError(null);

      // Usar el nuevo servicio tank-activities directamente
      const params = {
        startDate: formattedDate,
        bucket: selectedFarm
      };

      const data = await DataService.getTankActivities(params, session?.accessToken);

      if (data && Array.isArray(data) && data.length > 0) {
        const tankStatesData: TankStatesData = {
          date: formattedDate,
          states: data
        };

        setTankStates(tankStatesData);
        setTankStatesError(null);
      } else {
        setTankStates(null);
        setTankStatesError("No hay datos de estado del tanque disponibles para la fecha seleccionada");
      }

    } catch (err) {
      setTankStates(null);
      setTankStatesError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setTankStatesLoading(false);
    }
  }, [selectedFarm, filters.selectedDate, filters.dateRange?.from, filters.dateRange?.to, session?.accessToken]);
  
  // Auto-ejecutar fetchTankStates cuando cambien las dependencias - SOLO en modo histórico
  useEffect(() => {
    // Solo ejecutar en modo histórico
    if (mode !== 'historical') {
      return;
    }

    const hasDate = filters.selectedDate || (filters.dateRange?.from);
    const hasBasicRequirements = selectedFarm && hasDate && session?.accessToken;

    if (hasBasicRequirements) {
      fetchTankStates();
    }
  }, [mode, selectedFarm, filters.selectedDate, filters.dateRange?.from, filters.dateRange?.to, session?.accessToken]);

  const retryFetchTankStates = () => {
    setTankStatesError(null);
    fetchTankStates();
  };

  return {
    tankStates,
    tankStatesLoading,
    tankStatesError,
    fetchTankStates,
    retryFetchTankStates,
  };
};

export default useTankStates;
