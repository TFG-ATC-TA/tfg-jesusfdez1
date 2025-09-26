import { Html } from '@react-three/drei';

interface CallOutTextProps {
  position: [number, number, number];
  title: string;
  value: string | number | null | undefined;
}

const CallOutText = ({ position, title, value }: CallOutTextProps) => {
  return (
    <Html
      position={position}
      center
      distanceFactor={4}
      occlude
      // Ajustar el estilo del contenedor para que tenga un z-index bajo
      style={{
        pointerEvents: 'none',
        zIndex: -1, // Asegura que se renderice detrás de otros elementos como modales
      }}
    >
      <div className="pointer-events-auto">
        <div className="flex flex-col items-center justify-center p-2 text-center w-28">
          {/* Título */}
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-1">
            {title}
          </div>

          {/* Valor y Unidad */}
          <div className="text-lg font-bold text-gray-900">
            {value ?? "No Data"} <span className="text-sm text-gray-600"></span>
          </div>
        </div>
      </div>
    </Html>
  );
};

export default CallOutText; 
