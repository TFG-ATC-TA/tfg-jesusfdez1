import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { DanielService } from '@/services/daniel-service';

interface TankStatesParams {
  filters: {
    selectedDate?: Date;
    dateRange?: { from: Date | undefined; to: Date | undefined } | null;
  };
  boardIds: string[];
  selectedFarm: string;
  selectedTank: string;
}

interface TankState {
  startTime: string;
  endTime: string;
  state: string;
}

interface TankStatesData {
  date: string;
  states: TankState[];
}

const useTankStates = ({ filters, boardIds, selectedFarm, selectedTank }: TankStatesParams) => {
  const [tankStates, setTankStates] = useState<TankStatesData | null>(null);
  const [tankStatesLoading, setTankStatesLoading] = useState(false);
  const [tankStatesError, setTankStatesError] = useState<string | null>(null);

  const fetchTankStates = useCallback(async () => {
    try {
      const dateToUse =
        filters.selectedDate || (filters.dateRange ? filters.dateRange.from : null);

      if (!dateToUse) {
        console.warn("No date available for fetching tank states");
        return;
      }

      const formattedDate = format(new Date(dateToUse), "yyyy-MM-dd");

      setTankStatesLoading(true);
      setTankStatesError(null);

      console.log('=== Fetching Tank States ===');
      console.log('Selected Farm:', selectedFarm);
      console.log('Selected Tank:', selectedTank);
      console.log('Formatted Date:', formattedDate);

      // Usar el nuevo servicio tank-activities directamente
      const params = {
        startDate: formattedDate,
        bucket: selectedFarm
      };

      const data = await DanielService.getTankActivities(params);

      console.log('=== Tank Activities Response ===');
      console.log('Raw response:', data);

      if (data && Array.isArray(data) && data.length > 0) {
        console.log('=== Processing Tank Activities ===');
        console.log('Activities:', data);

        const tankStatesData: TankStatesData = {
          date: formattedDate,
          states: data
        };

        console.log('=== Processed Tank States ===');
        console.log('Tank states data:', tankStatesData);
        console.log('Number of states:', data.length);

        setTankStates(tankStatesData);
        setTankStatesError(null);
      } else {
        setTankStates(null);
        setTankStatesError("No hay datos de estado del tanque disponibles para la fecha seleccionada");
      }

    } catch (err) {
      console.error("Error fetching tank states:", err);
      setTankStates(null);
      setTankStatesError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setTankStatesLoading(false);
    }
  }, [selectedFarm, filters.selectedDate, filters.dateRange?.from, filters.dateRange?.to]);

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