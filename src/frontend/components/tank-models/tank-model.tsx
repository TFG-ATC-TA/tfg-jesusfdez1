import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { TankSelector } from "./tank-selector";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Loader2, X } from "lucide-react";
import CameraSettings from "./camera-settings";
import CameraControlButtons from "./camera-controls";
import SelectedSensorData from "./selected-sensor-data";

interface TankModelProps {
  mode?: "realtime" | "historical";
  filters?: { dateRange?: any };
  selectedTime?: any;
  handleTimeSelected?: (time: any) => void;
  selectedHistoricalData?: any;
  historicalData?: any;
  error?: any;
  fetchHistoricalData?: () => void;
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
}

const TankModel = ({
  mode = "realtime",
  filters,
  selectedTime,
  handleTimeSelected,
  selectedHistoricalData,
  historicalData,
  error,
  fetchHistoricalData,
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
}: TankModelProps) => {
  const [currentView, setCurrentView] = useState("default");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTank, setSelectedTank] = useState("horizontal-2-blades");
  const tankContainerRef = useRef<HTMLDivElement>(null);

  // Log when selectedTime changes
  useEffect(() => {
    if (selectedTime && handleTimeSelected) {
      handleTimeSelected(selectedTime);
    }
  }, [selectedTime, handleTimeSelected]);

  // Sincronizar la vista con selectedData
  useEffect(() => {
    if (selectedData) {
      setCurrentView(selectedData);
    } else {
      setCurrentView("default");
    }
  }, [selectedData]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleFullscreen = () => setIsFullscreen(true);
  const handleExitFullscreen = () => setIsFullscreen(false);

  // Use the data directly from props (already processed by parent component)
  const data = {
    encoderData,
    milkQuantityData,
    switchStatus,
    weightData,
    tankTemperaturesData,
    airQualityData,
  };

  // Debug: Log data processing
  console.log('=== TankModel Debug ===');
  console.log('Mode:', mode);
  console.log('Data from props:', data);
  console.log('Selected Data:', selectedData);
  
  if (mode === 'historical') {
    console.log('Air Quality Data:', data?.airQualityData);
    console.log('Weight Data:', data?.weightData);
    console.log('Tank Temperatures Data:', data?.tankTemperaturesData);
  }

  const renderTankModel = () => {
    // Case 1: Historical mode but no date range selected
    if (mode === "historical" && (!filters?.dateRange || (!filters.dateRange.from && !filters.dateRange.to))) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No se ha seleccionado fecha
            </h3>
            <p className="text-gray-500">
              Por favor selecciona un rango de fechas para ver los datos históricos de este tanque.
            </p>
          </div>
        </div>
      );
    }

    // Case 2: Historical mode and data is loading
    if (mode === "historical" && historicalData === "loading") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Cargando datos
            </h3>
            <p className="text-gray-500">
              Recuperando datos históricos para el período de tiempo seleccionado...
            </p>
          </div>
        </div>
      );
    }

    // Case 3: Historical mode and there was an error
    if (mode === "historical" && error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              {`Error al cargar datos: ${error.message}`}
            </h3>
            <p className="text-gray-500 mb-4">
              No se pudieron recuperar los datos históricos. Por favor intenta de nuevo o
              selecciona un período de tiempo diferente.
            </p>
            <Button
              onClick={fetchHistoricalData}
              className="bg-primary hover:bg-primary/90"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      );
    }

    // Case 4: Historical mode but no data available (not loading, no error)
    if (mode === "historical" && !historicalData) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay datos disponibles
            </h3>
            <p className="text-gray-500">
              No hay datos históricos disponibles para el período de tiempo seleccionado.
            </p>
          </div>
        </div>
      );
    }

    // Render the 3D tank model
    return (
      <div className="relative w-full h-full">
        {/* Tank selector - moved outside Canvas */}
        <div className="absolute top-2 right-2 z-30 bg-black/70 text-white p-2 rounded text-xs">
          <div className="mb-2 font-semibold">Tank Model:</div>
          <select
            value={selectedTank}
            onChange={(e) => setSelectedTank(e.target.value)}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value="horizontal-2-blades">Horizontal 2 Blades</option>
            <option value="horizontal-1-blade">Horizontal 1 Blade</option>
            <option value="vertical-1-blade">Vertical 1 Blade</option>
          </select>
        </div>
        
        <Canvas className="w-full h-full z-10">
          <ambientLight intensity={0.6} />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} />
          <Suspense fallback={null}>
            <TankSelector
              encoderData={data?.encoderData}
              milkQuantityData={data?.milkQuantityData}
              switchStatus={data?.switchStatus}
              weightData={data?.weightData}
              tankTemperaturesData={data?.tankTemperaturesData}
              airQualityData={data?.airQualityData}
              selectedData={selectedData}
              selectedTank={selectedTank}
              onTankChange={setSelectedTank}
            />
            <CameraSettings
              view={currentView}
              tankDisplay={selectedTank.includes('horizontal') ? 'horizontal' : 'vertical'}
              isFullscreen={isFullscreen}
              selectedData={selectedData}
            />
          </Suspense>
        </Canvas>
      </div>
    );
  };

  // Si está en fullscreen, solo renderiza el modelo y un botón para salir
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={handleExitFullscreen}
          >
            <X className="h-5 w-5 text-gray-700" />
            <span className="sr-only">Salir de pantalla completa</span>
          </Button>
        </div>
        <div className="flex-1 flex">{renderTankModel()}</div>
      </div>
    );
  }

  return (
    <div
      ref={tankContainerRef}
      className="bg-white relative transition-all duration-300 w-full h-full"
    >
      {/* Show sensor data overlay in realtime mode or historical mode with data */}
      {(mode === "realtime" || (mode === "historical" && filters?.dateRange && (filters.dateRange.from || filters.dateRange.to) && historicalData && historicalData !== "loading")) && (
          <div className="absolute top-4 left-4 z-20">
            <SelectedSensorData
              encoderData={data?.encoderData}
              milkQuantityData={data?.milkQuantityData}
              switchStatus={data?.switchStatus}
              weightData={data?.weightData}
              tankTemperaturesData={data?.tankTemperaturesData}
              airQualityData={data?.airQualityData}
              selectedData={selectedData}
              mode={mode}
            />
          </div>
      )}
      {renderTankModel()}
      
      {(mode === "realtime" || mode === "historical") && (
          <CameraControlButtons
            handleViewChange={handleViewChange}
            toggleFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            mode={mode}
          />
      )}
    </div>
  );
};

export default TankModel; 