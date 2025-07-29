import { HorizontalTank2Blades } from './horizontal-tank-2-blades';
import { HorizontalTank1Blade } from './horizontal-tank-1-blade';
import { VerticalTank1Blade } from './vertical-tank-1-blade';
import { SimpleTank } from './simple-tank';

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
  selectedData?: string | null;
  selectedTank?: string;
  onTankChange?: (tank: string) => void;
}

type TankType = 'horizontal-2-blades' | 'horizontal-1-blade' | 'vertical-1-blade';

export function TankSelector({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
  selectedTank = 'horizontal-2-blades',
  onTankChange,
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
      selectedData={selectedData}
    />
  );
} 