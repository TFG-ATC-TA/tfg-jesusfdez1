interface SimpleTankProps {
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

export function SimpleTank({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
}: SimpleTankProps) {
  return (
    <group>
      {/* Tanque básico */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 4, 32]} />
        <meshStandardMaterial color="#718096" />
      </mesh>
      
      {/* Aspas */}
      <mesh position={[0, 0.737, 0.918]} scale={0.148}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={[0, 0.737, -0.982]} scale={0.148}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      
      {/* Interruptor */}
      <mesh position={[0, 2.377, -0.206]}>
        <boxGeometry args={[1, 0.1, 0.5]} />
        <meshStandardMaterial color="#e53e3e" />
      </mesh>
      
      {/* Leche */}
      {(selectedData === "MilkQuantity" || selectedData == null) && (
        <mesh position={[0, 1.597, 0]} scale={[2.531, 2.531, 2.615]}>
          <cylinderGeometry args={[1, 1, 2, 32]} />
          <meshStandardMaterial color="#f0f8ff" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
} 