import { useState, useCallback } from 'react';
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

      const response = await DanielService.getTankStatePrediction({
        farm: selectedFarm,
        tank: selectedTank,
        date: formattedDate,
        boardIds,
      });

      // Transformar los datos del backend al formato que espera el TimeSeriesSlider
      if (response && response.states) {
        console.log('Datos del backend:', response);
        console.log('Estados del tanque:', response.states);
        
        const tankStatesData: TankStatesData = {
          date: formattedDate,
          states: response.states.map((state: any) => ({
            startTime: state.startTime,
            endTime: state.endTime,
            state: state.state
          }))
        };
        console.log('Datos transformados:', tankStatesData);
        setTankStates(tankStatesData);
      } else {
        console.log('No hay datos del backend o formato incorrecto:', response);
        setTankStates(null);
      }
    } catch (err) {
      console.error("Error fetching tank states:", err);
      setTankStates(null);
      setTankStatesError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setTankStatesLoading(false);
    }
  }, [filters, boardIds, selectedFarm, selectedTank]);

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