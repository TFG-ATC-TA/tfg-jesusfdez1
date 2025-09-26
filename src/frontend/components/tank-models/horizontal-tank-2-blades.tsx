import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import CallOutText from "./call-out-text";
import ParticleField from "./particle-field";
import { getRotationDuration, getAlcalineAcidCylinders, getVisibleMilkCilinder } from "./transformations";
import { useEffect } from "react";

// Import the correct type from the hook
import { TankStatesData } from '@/hooks/use-tank-states';

interface HorizontalTank2BladesProps {
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
  currentTankState?: string;
  tankStates?: TankStatesData | null;
}

export function HorizontalTank2Blades({
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
}: HorizontalTank2BladesProps) {
  const { nodes, materials, scene } = useGLTF(
    "/horizontalTankModel/horizontalTank2Blades.glb"
  );

  // Use currentTankState to determine tank appearance and behavior
  const tankStateConfig = {
    'MILKING': { color: '#10B981', speed: 2.0 },      // Verde
    'COOLING': { color: '#3B82F6', speed: 0.5 },      // Azul
    'CLEANING': { color: '#F59E0B', speed: 1.5 },     // Amarillo
    'EMPTY TANK': { color: '#6B7280', speed: 0 },     // Gris
    'MAINTENANCE': { color: '#8B5CF6', speed: 0 },    // Púrpura
  };

  const currentConfig = tankStateConfig[currentTankState as keyof typeof tankStateConfig] || tankStateConfig['EMPTY TANK'];

  useEffect(() => {
    // Tank state configuration is now handled by currentTankState prop
  }, [nodes, materials, scene]);

  // Use currentConfig.speed to modify blade rotation based on tank state
  const rotationBlade1 = useSpring({
    loop: currentConfig.speed > 0,
    to: { rotation: [0, Math.PI * 2, 0] },
    from: { rotation: [0, 0, 0] },
    config: { duration: currentConfig.speed > 0 ? getRotationDuration(encoderData?.value["00"] ?? 0) / currentConfig.speed : 10000 },
  });

  const rotationBlade2 = useSpring({
    loop: currentConfig.speed > 0,
    to: { rotation: [0, -Math.PI * 2, 0] },
    from: { rotation: [0, 0, 0] },
    config: { duration: currentConfig.speed > 0 ? getRotationDuration(encoderData?.value["01"] ?? 0) / currentConfig.speed : 10000 },
  });

  const { rotation: rotationHatch } = useSpring({
    to: {
      rotation:
        switchStatus?.value || false ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
    },
    config: { duration: 1000 },
  });

  const renderMilkQuantity = () => {
    const range = getVisibleMilkCilinder(milkQuantityData?.value ?? 0);
    if (!range) return null;

    const nodeKey = `MilkCilinder${range.max}`;
    const node = nodes[nodeKey] as any;
    
    if (!node) {
      console.log(`❌ Milk node ${nodeKey} not found, trying fallback nodes`);
      // Try alternative node names
      const fallbackNodes = [
        'MilkCilinder',
        'MilkCylinder',
        'Milk',
        `MilkCilinder${range.min}`,
        `MilkCylinder${range.max}`,
        `MilkCylinder${range.min}`
      ];
      
      for (const fallbackKey of fallbackNodes) {
        const fallbackNode = nodes[fallbackKey] as any;
        if (fallbackNode) {
          console.log(`✅ Using fallback node: ${fallbackKey}`);
          return (
            <mesh
              geometry={fallbackNode.geometry}
              material={materials["MilkMaterial"] || materials.MilkMaterial}
              position={[-0.026, 1.597, -0.096]}
              scale={[2.531, 2.531, 2.615]}
            />
          );
        }
      }
      
      console.log(`❌ No milk nodes found in model`);
      return null;
    }
    
    return (
      <mesh
        geometry={node.geometry}
        material={materials["MilkMaterial"] || materials.MilkMaterial}
        position={[-0.026, 1.597, -0.096]}
        scale={[2.531, 2.531, 2.615]}
      />
    );
  };

  const renderEncoder = () => {
    const blade1 = nodes.Blade1 as any;
    const blade2 = nodes.Blade2 as any;
    const blade1Hat = nodes.Blade1Hat as any;
    const blade2Hat = nodes.Blade2Hat as any;

    if (!blade1 || !blade2) {
      console.log("❌ Blade nodes not found");
      return null;
    }

    return (
      <>
        <animated.mesh
          geometry={blade2.geometry}
          material={materials["BladeMaterial"]}
          position={[0, 0.737, 0.918]}
          scale={-0.148}
          rotation={rotationBlade1.rotation as any}
        />
        <animated.mesh
          geometry={blade1.geometry}
          material={materials["BladeMaterial"]}
          position={[0, 0.737, -0.982]}
          scale={-0.148}
          rotation={rotationBlade2.rotation as any}
        />
        {blade2Hat && (
          <mesh
            geometry={blade2Hat.geometry}
            material={materials["BladeMaterial"]}
            position={[-0.003, 2.451, 0.916]}
            scale={[0.107, 0.078, 0.107]}
          />
        )}
        {blade1Hat && (
          <mesh
            geometry={blade1Hat.geometry}
            material={materials["BladeMaterial"]}
            position={[-0.003, 2.451, -0.988]}
            scale={[0.104, 0.076, 0.104]}
          />
        )}
        <CallOutText
          position={[0, 2.75, 1.1]}
          title={"Encoder"}
          value={`${encoderData?.value["00"] ?? "No data"}`}
        />
        <CallOutText
          position={[0, 2.75, -1.1]}
          title={"Encoder"}
          value={`${encoderData?.value["01"] ?? "No data"}`}
        />
      </>
    );
  };

  const renderMagneticSwitch = () => {
    const hatch = nodes.Hatch as any;
    
    if (!hatch) {
      console.log("❌ Hatch node not found");
      return null;
    }

    return (
      <>
        <animated.mesh
          geometry={hatch.geometry}
          material={materials["HatchMaterial"]}
          position={[0, 2.377, -0.206]}
          rotation={rotationHatch as any}
        />
        <CallOutText
          position={[0, 2.75, 0]}
          title={"Magnetic Switch"}
          value={`${
            switchStatus === null
              ? "No Data"
              : switchStatus?.value
              ? "Open"
              : "Closed"
          }`}
        />
      </>
    );
  };

  const renderWeight = () => {
    const { alcalineMorph, acidMorph } = getAlcalineAcidCylinders({
      quantity: weightData?.value ?? 0,
      maxValue: 100,
    });

    const alcalineCilinder = nodes.AlcalineCilinder as any;
    const acidCilinder = nodes.AcidCilinder as any;
    const barrelAlcaline = nodes.BarrelAlcaline as any;
    const barrelAcid = nodes.BarrelAcid as any;

    if (!alcalineCilinder || !acidCilinder) {
      console.log("❌ Weight nodes not found");
      return null;
    }

    return (
      <>
        <mesh
          name="AlcalineCilinder"
          geometry={alcalineCilinder.geometry}
          material={materials["AlcalineMaterial"]}
          morphTargetDictionary={alcalineCilinder.morphTargetDictionary}
          morphTargetInfluences={alcalineMorph}
          position={[1.27, 0, 2.91]}
          scale={[0.19, 0.01, 0.19]}
        />
        <mesh
          name="AcidCilinder"
          geometry={acidCilinder.geometry}
          material={materials["AcidMaterial"]}
          morphTargetDictionary={acidCilinder.morphTargetDictionary}
          morphTargetInfluences={acidMorph}
          position={[1.91, 0, 3.25]}
          scale={[0.19, 0.01, 0.19]}
        />
        {barrelAlcaline && (
          <mesh
            geometry={barrelAlcaline.geometry}
            material={barrelAlcaline.material}
            position={[1.36, 0.27, 2.85]}
          />
        )}
        {barrelAcid && (
          <mesh
            geometry={barrelAcid.geometry}
            material={barrelAcid.material}
            position={[2, 0.27, 3.19]}
          />
        )}
        <CallOutText
          position={[1.3, 0.95, 2.8]}
          title={"Alcaline"}
          value={weightData?.value ?? 0}
        />
        <CallOutText
          position={[2, 0.9, 2.9]}
          title={"Acid"}
          value={weightData?.value ?? 0}
        />
      </>
    );
  };

  const renderTankTemperatures = () => {
    const range = getVisibleMilkCilinder(milkQuantityData?.value ?? 0);

    if (!range) return null;

    const nodeKey = `MilkCilinder${range.max}`;
    const node = nodes[nodeKey] as any;

    if (!node) {
      console.log(`❌ Temperature node ${nodeKey} not found`);
      return null;
    }

    return (
      <mesh
        geometry={node.geometry}
        material={materials["MilkMaterial"]}
        position={[-0.026, 1.597, -0.096]}
        scale={[2.531, 2.531, 2.615]}
      />
    );
  };

  const renderAirQuality = () => (
    <ParticleField 
      particleCount={1000} 
      humidity={airQualityData?.value.humidity || 0} 
      temperature={airQualityData?.value.temperature || 0} 
    />
  );

  // Verificar si el tanque principal existe
  const tankCilinder = nodes.TankCilinder as any;
  if (!tankCilinder) {
    console.log("❌ TankCilinder node not found - showing fallback");
    return (
      <group dispose={null}>
        {/* Fallback básico */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[2, 2, 4, 32]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
        
        {/* Fallback para aspas */}
        <animated.mesh
          position={[0, 0.737, 0.918]}
          scale={0.148}
          rotation={rotationBlade1.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        <animated.mesh
          position={[0, 0.737, -0.982]}
          scale={0.148}
          rotation={rotationBlade2.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        
        {/* Fallback para interruptor */}
        <animated.mesh
          position={[0, 2.377, -0.206]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {/* Fallback para leche */}
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[0, 1.597, 0]} scale={[2.531, 2.531, 2.615]}>
            <cylinderGeometry args={[1, 1, 2, 32]} />
            <meshStandardMaterial color="#f0f8ff" transparent opacity={0.7} />
          </mesh>
        )}
        
        {/* CallOutText para mostrar el error */}
        <CallOutText
          position={[0, 3, 0]}
          title={"Error"}
          value={"GLB not loaded"}
        />
        
        {/* CallOutText para datos */}
        <CallOutText
          position={[0, 2.75, 1.1]}
          title={"Encoder"}
          value={`${encoderData?.value["00"] ?? "No data"}`}
        />
        <CallOutText
          position={[0, 2.75, -1.1]}
          title={"Encoder"}
          value={`${encoderData?.value["01"] ?? "No data"}`}
        />
        <CallOutText
          position={[0, 2.75, 0]}
          title={"Switch"}
          value={`${switchStatus?.value ? "Open" : "Closed"}`}
        />
      </group>
    );
  }

  return (
    <group dispose={null}>
      <mesh
        geometry={tankCilinder.geometry}
        material={materials["TankMaterial"]}
        position={[0.548, 0.399, -1.476]}
      />
      {(selectedData === "MilkQuantity" || selectedData == null) &&
        renderMilkQuantity()}
      {(selectedData === "Encoder" || selectedData == null) && renderEncoder()}
      {(selectedData === "MagneticSwitch" || selectedData == null) &&
        renderMagneticSwitch()}
      {(selectedData === "Weight" || selectedData == null) && renderWeight()}
      {(selectedData === "TankTemperatures") &&
        renderTankTemperatures()}
      {selectedData === "AirQuality" && renderAirQuality()}
    </group>
  );
}

useGLTF.preload("/horizontalTankModel/horizontalTank2Blades.glb"); 
