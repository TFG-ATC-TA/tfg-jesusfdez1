import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { CameraControls } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize, Minimize, ArrowUpFromLine, Square, PanelLeft } from 'lucide-react';

// Tipos de datos de sensores
export interface EncoderData {
  value: { [key: string]: number };
}

export interface MilkQuantityData {
  value: number;
}

export interface SwitchStatus {
  value: boolean;
}

export interface WeightData {
  value: number;
}

export interface TankTemperaturesData {
  value: {
    over_surface_temperature?: number;
    surface_temperature?: number;
    submerged_temperature?: number;
  };
  tags?: { board_id?: string };
  readableDate?: string;
}

export interface AirQualityData {
  value: { humidity: number; temperature: number };
}

export interface GyroscopeData {
  value: {
    gyro_x?: number;
    gyro_y?: number;
    gyro_z?: number;
    accel_x?: number;
    accel_y?: number;
    accel_z?: number;
  };
}

// Tipos de datos de sensores combinados
export interface SensorData {
  encoderData?: EncoderData;
  milkQuantityData?: MilkQuantityData;
  switchStatus?: SwitchStatus;
  weightData?: WeightData;
  tankTemperaturesData?: TankTemperaturesData;
  airQualityData?: AirQualityData;
  gyroscopeData?: GyroscopeData;
}

// Props base para todos los componentes de tanques
export interface BaseTankProps extends SensorData {
  selectedData?: string | null;
}

// Props específicas para tanques con estados
export interface TankWithStatesProps extends BaseTankProps {
  currentTankState?: string;
  tankStates?: any;
}

// Props para el selector de tanques
export interface TankSelectorProps extends TankWithStatesProps {
  selectedTank?: string;
  onTankChange?: (tank: string) => void;
}

// Props para el modelo principal de tanque
export interface TankModelProps extends TankWithStatesProps {
  mode?: "realtime" | "historical";
  filters?: { dateRange?: any };
  selectedTime?: any;
  handleTimeSelected?: (time: any) => void;
  selectedHistoricalData?: any;
  historicalData?: any;
  tankStatesLoading?: boolean;
  error?: any;
  fetchHistoricalData?: () => void;
}

// Props para datos de sensores seleccionados
export interface SelectedSensorDataProps extends SensorData {
  selectedData?: string | null;
  mode?: 'realtime' | 'historical';
}

// Props para controles de cámara
export interface CameraControlButtonsProps {
  handleViewChange: (view: string) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  mode?: 'realtime' | 'historical';
}

// Props para configuración de cámara
export interface CameraSettingsProps {
  view: string;
  tankDisplay?: string;
  isFullscreen: boolean;
  selectedData?: string | null;
}

// Props para texto de llamada
export interface CallOutTextProps {
  position: [number, number, number];
  title: string;
  value: string | number | null | undefined;
}

// Props para campo de partículas
export interface ParticleFieldProps {
  particleCount?: number;
  zone?: { x: [number, number]; y: [number, number]; z: [number, number] };
  humidity?: number;
  temperature?: number;
}

// Tipos de tanques disponibles
export type TankType = 'horizontal-2-blades' | 'horizontal-1-blade' | 'vertical-1-blade';

// Tipos de datos seleccionables
export type SelectedDataType = 
  | 'MilkQuantity' 
  | 'TankTemperatures' 
  | 'MagneticSwitch' 
  | 'Encoder' 
  | 'Gyroscope' 
  | 'Weight' 
  | 'AirQuality';

// Modos de visualización
export type DisplayMode = 'realtime' | 'historical';

// Estados de tanque
export type TankState = 'MILKING' | 'COOLING' | 'CLEANING' | 'EMPTY TANK' | 'MAINTENANCE';

// Interfaz para el estado del tanque con tiempo
export interface TankStateWithTime {
  state: TankState;
  startTime: string;
  endTime: string;
}

// Configuración de vistas de cámara
export const cameraViews = {
  horizontal: {
    Encoder: { position: [0, 4, 0], target: [-1, -4, 0] },
    MagneticSwitch: { position: [1, 3, -1], target: [0, 2, 0] },
    MilkQuantity: { position: [0, 1, -4], target: [0, 1, -1] },
    Weight: { position: [2, 0.9, 1.5], target: [1.5, 0.5, 3.5] },
    TankTemperatures: { position: [3, 1, 0], target: [0, 1, 0] },
    AirQuality: { position: [2, 2, 3], target: [0, 1, 0] },
    Gyroscope: { position: [2, 2, 3], target: [0, 1, 0] },
    default: { position: [3.4, 1.7, -1], target: [0, 1.2, 0.2] },
    front: { position: [0, 2, 5], target: [0, 0, 0] },
    lateral: { position: [5, 2, 0], target: [0, 0, 0] },
    top: { position: [0, 5, 0], target: [0, 0, 0] },
  },
  vertical: {
    Encoder: { position: [0, 4, 0], target: [-1, -4, 0] },
    MagneticSwitch: { position: [1.5, 3.4, -0.8], target: [0, 2.5, 0] },
    MilkQuantity: { position: [2, 1.5, -2], target: [0, 1.5, 0] },
    Weight: { position: [1.7, 0.5, 0.3], target: [1.4, 0.5, 1.5] },
    TankTemperatures: { position: [3, 1, 0], target: [0, 1, 0] },
    Gyroscope: { position: [2, 2, 3], target: [0, 1, 0] },
    AirQuality: { position: [2, 2, 3], target: [0, 1, 0] },
    default: { position: [2.8, 2.4, -1.3], target: [0, 1.4, 0] },
    front: { position: [0, 2, 5], target: [0, 0, 0] },
    lateral: { position: [5, 2, 0], target: [0, 0, 0] },
    top: { position: [0, 5, 0], target: [0, 0, 0] },
  },
} as const;

// Configuración de estados de tanque
export const tankStateConfig = {
  'MILKING': { color: '#10B981', speed: 2.0 },      // Verde
  'COOLING': { color: '#3B82F6', speed: 0.5 },      // Azul
  'CLEANING': { color: '#F59E0B', speed: 1.5 },     // Amarillo
  'EMPTY TANK': { color: '#6B7280', speed: 0 },     // Gris
  'MAINTENANCE': { color: '#8B5CF6', speed: 0 },    // Púrpura
} as const;

// Configuración de colores de estado para sensores
export const sensorStatusColors = {
  temperature: { low: 0, medium: 5, high: 10 },
  humidity: { low: 30, medium: 70, high: 90 },
  weight: { low: 30, medium: 70, high: 90 },
} as const;

// Configuración de umbrales para alertas
export const alertThresholds = {
  temperature: { warning: 5, critical: 10 },
  humidity: { warning: 70, critical: 90 },
  weight: { warning: 70, critical: 90 },
} as const;

// Configuración de partículas por defecto
export const defaultParticleConfig = {
  particleCount: 1000,
  zone: { x: [-3, 5] as [number, number], y: [-5, 5] as [number, number], z: [-5, 5] as [number, number] },
};

// Configuración de cámara por defecto
export const defaultCameraConfig = {
  minDistance: 2,
  maxDistance: 15,
} as const;

// Utilidades para rotación de aspas
export const getRotationDuration = (encoderData: number | null | undefined) => {
  if (encoderData === null || encoderData === undefined || encoderData <= 0) return 0;
  const minDuration = 1000;
  const maxDuration = 7000;
  const minRPM = 0;
  const maxRPM = 1000;

  const rpm = Math.min(Math.max(encoderData, minRPM), maxRPM);
  const duration =
    maxDuration -
    ((rpm - minRPM) * (maxDuration - minDuration)) / (maxRPM - minRPM);

  return duration;
};

// Utilidades para cilindros de alcalina y ácido
export const getAlcalineAcidCylinders = ({ quantity, maxValue }: { quantity: number; maxValue: number }) => {
  const calculateMorphTargets = (quantity: number, maxValue: number) => {
    const percentage = Math.min(quantity / maxValue, 1);
    const morph1 = percentage * 0.5;
    const morph2 = percentage * 0.3;
    const morph3 = percentage * 0.2;
    return [morph1, morph2, morph3];
  };

  const alcalineMorph = calculateMorphTargets(quantity, maxValue);
  const acidMorph = calculateMorphTargets(quantity, maxValue);

  return { alcalineMorph, acidMorph };
};

// Utilidades para visualización de leche
export const getVisibleMilkCilinder = (quantity: number | null | undefined) => {
  const ranges = [
    { min: 0, max: 10 },
    { min: 10, max: 20 },
    { min: 20, max: 30 },
    { min: 30, max: 40 },
    { min: 40, max: 50 },
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90},
    { min: 90, max: 100},
  ];

  if (quantity == null || quantity <= 0) return null;
  
  // Handle quantities greater than 100
  if (quantity > 100) {
    return ranges[ranges.length - 1]; // Return the last range for quantities > 100
  }
  
  const range = ranges.find(
    ({ min, max }) => quantity >= min && quantity < max
  );

  return range || null;
};

// Utilidades para crear textura de círculo para partículas
export function createCircleTexture() {
  const size = 120;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Utilidades para obtener iconos de sensores
export const getSensorIcon = (selectedData: string | null) => {
  const iconMap = {
    "MilkQuantity": "Droplet",
    "TankTemperatures": "Thermometer", 
    "MagneticSwitch": "ToggleLeft",
    "Encoder": "Gauge",
    "Gyroscope": "Compass",
    "Weight": "Weight",
    "AirQuality": "Wind",
  };
  
  return iconMap[selectedData as keyof typeof iconMap] || null;
};

// Utilidades para obtener etiquetas de sensores
export const getSensorLabel = (selectedData: string | null) => {
  const labelMap = {
    "MilkQuantity": "Cantidad de Leche",
    "TankTemperatures": "Temperatura del Tanque",
    "MagneticSwitch": "Interruptor Magnético",
    "Encoder": "Encoder",
    "Gyroscope": "Giroscopio",
    "Weight": "Peso",
    "AirQuality": "Calidad del Aire",
  };
  
  return labelMap[selectedData as keyof typeof labelMap] || "";
};

// Utilidades para validar datos de sensores
export const hasValidSensorData = (data: any) => {
  return data && data.value !== undefined && data.value !== null;
};

// Utilidades para formatear valores de sensores
export const formatSensorValue = (value: number | undefined, unit: string, decimals: number = 1) => {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(decimals)}${unit}`;
};

// Utilidades para obtener colores de estado
export const getStatusColor = (value: number | undefined, thresholds: { low: number; medium: number; high: number }) => {
  if (value === undefined || value === null) return "text-gray-600";
  if (value <= thresholds.low) return "text-green-600";
  if (value <= thresholds.medium) return "text-yellow-600";
  return "text-red-600";
};

// ===== COMPONENTES DE CÁMARA =====

// Tipos para configuración de cámara
type CameraViewKey = keyof typeof cameraViews.horizontal | keyof typeof cameraViews.vertical;
type TankDisplay = 'horizontal' | 'vertical';

// Componente de configuración de cámara
export const CameraSettings = ({ view, tankDisplay = 'horizontal', isFullscreen, selectedData }: CameraSettingsProps) => {
  const cameraControlsRef = useRef<any>();

  // Helper function to get camera config safely
  const getCameraConfig = (tankDisplay: string, viewToUse: string) => {
    const tankConfig = cameraViews[tankDisplay as TankDisplay];
    if (!tankConfig) {
      return cameraViews.horizontal.default;
    }

    // Check if viewToUse is a valid key for this tank display
    if (viewToUse in tankConfig) {
      return tankConfig[viewToUse as CameraViewKey];
    }

    // Fallback to default
    return tankConfig.default || cameraViews.horizontal.default;
  };

  useEffect(() => {
    if (cameraControlsRef.current) {
      // Determinar qué vista usar basado en selectedData o view
      const viewToUse = selectedData || view;
      
      // Si no hay vista específica seleccionada, permitir libertad de cámara
      if (viewToUse === "default" || !viewToUse) {
        // Configuración para libertad de cámara
        cameraControlsRef.current.dollyEnabled = true;
        cameraControlsRef.current.zoomEnabled = true;
        cameraControlsRef.current.rotateEnabled = true;
        cameraControlsRef.current.truckEnabled = true;
        
        cameraControlsRef.current.mouseButtons.left = 1;    // Rotar
        cameraControlsRef.current.mouseButtons.right = 2;   // Mover
        cameraControlsRef.current.mouseButtons.middle = 2;  // Mover
        cameraControlsRef.current.mouseButtons.wheel = 8;   // Zoom
        
        cameraControlsRef.current.touches.one = 1;   // Rotar
        cameraControlsRef.current.touches.two = 2;   // Mover
        cameraControlsRef.current.touches.three = 2; // Mover
        
        // Establecer posición inicial pero permitir libertad
        const config = getCameraConfig(tankDisplay, 'default');
        
        cameraControlsRef.current.setLookAt(
          ...config.position,
          ...config.target,
          true
        );
      } else {
        // Vista específica seleccionada - aplicar configuración fija
        const config = getCameraConfig(tankDisplay, viewToUse);

        cameraControlsRef.current.setLookAt(
          ...config.position,
          ...config.target,
          true
        );

        if (isFullscreen) {
          // Permitir solo rotar y hacer zoom limitado en fullscreen, NO mover (truck/dolly)
          cameraControlsRef.current.dollyEnabled = false;
          cameraControlsRef.current.truckEnabled = false;
          cameraControlsRef.current.rotateEnabled = true;
          cameraControlsRef.current.zoomEnabled = true;

          cameraControlsRef.current.mouseButtons.left = 1;    // Rotar
          cameraControlsRef.current.mouseButtons.right = 0;   // No mover
          cameraControlsRef.current.mouseButtons.middle = 0;  // No mover
          cameraControlsRef.current.mouseButtons.wheel = 8;   // Zoom

          cameraControlsRef.current.touches.one = 1;   // Rotar
          cameraControlsRef.current.touches.two = 0;   // No mover
          cameraControlsRef.current.touches.three = 0;
        } else {
          // Bloquear todas las interacciones fuera de fullscreen para vistas específicas
          cameraControlsRef.current.dollyEnabled = false;
          cameraControlsRef.current.zoomEnabled = false;
          cameraControlsRef.current.rotateEnabled = false;
          cameraControlsRef.current.truckEnabled = false;
          cameraControlsRef.current.mouseButtons.left = 0;
          cameraControlsRef.current.mouseButtons.right = 0;
          cameraControlsRef.current.mouseButtons.middle = 0;
          cameraControlsRef.current.mouseButtons.wheel = 0;
          cameraControlsRef.current.touches.one = 0;
          cameraControlsRef.current.touches.two = 0;
          cameraControlsRef.current.touches.three = 0;
        }
      }
    }
  }, [view, tankDisplay, isFullscreen, selectedData]);

  return (
    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      minDistance={defaultCameraConfig.minDistance} 
      maxDistance={defaultCameraConfig.maxDistance} 
    />
  );
};

// Componente de controles de cámara
export const CameraControlButtons = ({ 
  handleViewChange, 
  toggleFullscreen, 
  isFullscreen,
  mode = 'realtime'
}: CameraControlButtonsProps) => {
  const [currentView, setCurrentView] = useState("default");

  const toggleView = (view: string) => {
    if (currentView === view) {
      setCurrentView("default");
      handleViewChange("default");
    } else {
      setCurrentView(view);
      handleViewChange(view);
    }
  };

  return (
    <div className="absolute bottom-3 right-3 z-50 flex flex-col gap-2 sm:flex-row">
      <TooltipProvider>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md p-1.5 flex flex-row sm:flex-row gap-1.5 border border-gray-200 dark:border-gray-700">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "lateral" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "lateral" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("lateral")}
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Vista Lateral</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Lateral</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "front" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "front" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("front")}
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">Vista Frontal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Frontal</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === "top" ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 ${
                  currentView === "top" 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => toggleView("top")}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="sr-only">Vista Zenital</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Vista Zenital</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                <span className="sr-only">{isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

// ===== COMPONENTES DE TANQUES =====

// Componente unificado de tanque
export const UnifiedTank = ({ 
  tankType = 'horizontal-2-blades',
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  gyroscopeData,
  selectedData,
  currentTankState = 'EMPTY TANK',
  tankStates,
}: TankWithStatesProps & { tankType?: TankType }) => {
  // Configuración de tanques
  const tankConfigs = {
    'horizontal-2-blades': {
      modelPath: '/horizontalTankModel/horizontalTank2Blades.glb',
      bladeCount: 2,
      tankType: 'horizontal' as const,
      positions: {
        milk: [-0.026, 1.597, -0.096],
        milkScale: [2.531, 2.531, 2.615],
        tank: [0.548, 0.399, -1.476],
        tankScale: [1, 1, 1],
        blade1: [0, 0.737, 0.918],
        blade2: [0, 0.737, -0.982],
        hatch: [0, 2.377, -0.206],
        weight: {
          alcaline: [1.27, 0, 2.91],
          acid: [1.91, 0, 3.25],
          barrelAlcaline: [1.36, 0.27, 2.85],
          barrelAcid: [2, 0.27, 3.19],
          callOutAlcaline: [1.3, 0.95, 2.8],
          callOutAcid: [2, 0.9, 2.9],
        }
      }
    },
    'horizontal-1-blade': {
      modelPath: '/horizontalTankModel/horizontalTank1Blade.glb',
      bladeCount: 1,
      tankType: 'horizontal' as const,
      positions: {
        milk: [-0.026, 1.597, -0.122],
        milkScale: [2.531, 2.531, 1.974],
        tank: [0.548, 0.399, -1.164],
        tankScale: [1, 1, 0.755],
        blade1: [0, 0.737, -0.077],
        blade2: null,
        hatch: [0, 2.377, 0.916],
        weight: {
          alcaline: [0.744, -0.001, 2.754],
          acid: [1.591, -0.001, 2.996],
          barrelAlcaline: [0.835, 0.27, 2.695],
          barrelAcid: [1.683, 0.27, 2.937],
          callOutAlcaline: [0.85, 0.9, 2.7],
          callOutAcid: [1.7, 0.9, 2.9],
        }
      }
    },
    'vertical-1-blade': {
      modelPath: '/verticalTankModel/verticalTank1Blade.glb',
      bladeCount: 1,
      tankType: 'vertical' as const,
      positions: {
        milk: [-0.002, 1.398, 0.012],
        milkScale: [0.782, 1.311, 0.782],
        tank: [0.391, -0.004, -0.541],
        tankScale: [0.31, 0.169, 0.31],
        blade1: [-0.006, 0.495, 0.022],
        blade2: null,
        hatch: [0, 2.79, -0.606],
        weight: {
          alcaline: [0.824, -0.001, 1.634],
          acid: [1.671, -0.001, 1.876],
          barrelAlcaline: [0.915, 0.27, 1.575],
          barrelAcid: [1.763, 0.27, 1.817],
          callOutAlcaline: [0.85, 0.9, 1.55],
          callOutAcid: [1.7, 0.9, 1.8],
        }
      }
    }
  };

  const config = tankConfigs[tankType];
  const currentConfig = tankStateConfig[currentTankState as keyof typeof tankStateConfig] || tankStateConfig['EMPTY TANK'];

  // Esta función se implementaría con la lógica de renderizado unificada
  // Por ahora retornamos null para mantener la compatibilidad
  return null;
}; 
