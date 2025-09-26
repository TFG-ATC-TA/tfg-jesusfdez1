import { HorizontalTank2Blades } from './horizontal-tank-2-blades';
import { HorizontalTank1Blade } from './horizontal-tank-1-blade';
import { VerticalTank1Blade } from './vertical-tank-1-blade';
import { SimpleTank } from './simple-tank';

// Import the correct type from the hook
import { TankStatesData } from '@/hooks/use-tank-states';

interface TankSelectorProps {
  encoderData?: { value: { [key: string]: number } };
  milkQuantityData?: { value: number };
  switchStatus?: { value: boolean };
  weightData?: { value: number };
  tankTemperaturesData?: { 
    value: { 
      over_surface_temperature?: number;
      surface_temperature?: number;
      submerged_temperature?: number;
    };
    tags?: { board_id?: string };
    readableDate?: string;
  };
  airQualityData?: { value: { humidity: number; temperature: number } };
  gyroscopeData?: { value: { gyro_x?: number; gyro_y?: number; gyro_z?: number; accel_x?: number; accel_y?: number; accel_z?: number } };
  selectedData?: string | null;
  selectedTank?: string;
  onTankChange?: (tank: string) => void;
  currentTankState?: string;
  tankStates?: TankStatesData | null;
}

type TankType = 'horizontal-2-blades' | 'horizontal-1-blade' | 'vertical-1-blade';

export function TankSelector({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  gyroscopeData,
  selectedData,
  selectedTank = 'horizontal-2-blades',
  onTankChange,
  currentTankState,
  tankStates,
}: TankSelectorProps) {
  const tankComponents = {
    'horizontal-2-blades': HorizontalTank2Blades,
    'horizontal-1-blade': HorizontalTank1Blade,
    'vertical-1-blade': VerticalTank1Blade,
  };

  const TankComponent = tankComponents[selectedTank as TankType];

  // Usar SimpleTank como fallback si hay problemas
  const ComponentToRender = TankComponent || SimpleTank;

  return (
    <ComponentToRender
      encoderData={encoderData}
      milkQuantityData={milkQuantityData}
      switchStatus={switchStatus}
      weightData={weightData}
      tankTemperaturesData={tankTemperaturesData}
      airQualityData={airQualityData}
      gyroscopeData={gyroscopeData}
      selectedData={selectedData}
      currentTankState={currentTankState}
      tankStates={tankStates}
    />
  );
} 
