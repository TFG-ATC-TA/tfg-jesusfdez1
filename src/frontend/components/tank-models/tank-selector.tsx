import { HorizontalTank2Blades, HorizontalTank1Blade, VerticalTank1Blade } from './unified-tanks';
import { TankSelectorProps, TankType } from './transformations';
import { Html } from '@react-three/drei';

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

  // Si no hay componente válido, mostrar aviso de error
  if (!TankComponent) {
    return (
      <group>
        <Html position={[0, 0, 0]} center>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error de Modelo de Tanque
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>No se pudo cargar el modelo de tanque seleccionado: <strong>{selectedTank}</strong></p>
                  <p className="mt-1">Por favor, selecciona un modelo válido o contacta al administrador.</p>
                </div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    );
  }

  return (
    <TankComponent
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
