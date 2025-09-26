import { useRef, useEffect } from "react";
import { CameraControls } from "@react-three/drei";

// Configuración de vistas de cámara
const cameraViews = {
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

type CameraViewKey = keyof typeof cameraViews.horizontal | keyof typeof cameraViews.vertical;
type TankDisplay = keyof typeof cameraViews;

interface CameraSettingsProps {
  view: string;
  tankDisplay?: string;
  isFullscreen: boolean;
  selectedData?: string | null;
}

const CameraSettings = ({ view, tankDisplay = 'horizontal', isFullscreen, selectedData }: CameraSettingsProps) => {
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
    <>
      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        minDistance={2} 
        maxDistance={15} 
      />
    </>
  );
};

export default CameraSettings;
