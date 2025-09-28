import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import { Html } from '@react-three/drei';
import ParticleField from "./particle-field";
import { 
  getRotationDuration, 
  getAlcalineAcidCylinders, 
  getVisibleMilkCilinder, 
  TankWithStatesProps, 
  BaseTankProps,
  tankStateConfig,
  CallOutTextProps 
} from "./transformations";
import { useEffect } from "react";

// ===== COMPONENTE CALL OUT TEXT =====
export const CallOutText = ({ position, title, value }: CallOutTextProps) => {
  return (
    <Html
      position={position}
      center
      distanceFactor={4}
      occlude
      style={{
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <div className="pointer-events-auto">
        <div className="flex flex-col items-center justify-center p-2 text-center w-28">
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-1">
            {title}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {value ?? "No Data"} <span className="text-sm text-gray-600"></span>
          </div>
        </div>
      </div>
    </Html>
  );
};

// ===== TANQUE HORIZONTAL 2 ASPAS =====
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
}: TankWithStatesProps) {
  const { nodes, materials, scene } = useGLTF(
    "/horizontalTankModel/horizontalTank2Blades.glb"
  );

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

// ===== TANQUE HORIZONTAL 1 ASPA =====
export function HorizontalTank1Blade({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
}: BaseTankProps) {
  const { nodes, materials } = useGLTF('/horizontalTankModel/horizontalTank1Blade.glb');

  const rotationBlade = useSpring({
    loop: true,
    to: { rotation: [0, Math.PI * 2, 0] },
    from: { rotation: [0, 0, 0] },
    config: { duration: getRotationDuration(encoderData?.value["00"] ?? 0) },
  });

  const { rotation: rotationHatch } = useSpring({
    to: {
      rotation: switchStatus?.value || false ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
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
              position={[-0.026, 1.597, -0.122]}
              scale={[2.531, 2.531, 1.974]}
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
        position={[-0.026, 1.597, -0.122]}
        scale={[2.531, 2.531, 1.974]}
      />
    );
  };

  const renderEncoder = () => {
    const blade = nodes.Blade as any;
    const bladeHat = nodes.BladeHat as any;

    if (!blade) {
      console.log("❌ Blade node not found");
      return null;
    }

    return (
      <>
        <animated.mesh
          geometry={blade.geometry}
          material={materials["BladeMaterial"]}
          position={[0, 0.737, -0.077]}
          scale={-0.148}
          rotation={rotationBlade.rotation as any}
        />
        {bladeHat && (
          <mesh
            geometry={bladeHat.geometry}
            material={materials["BladeMaterial"]}
            position={[0, 2.451, -0.081]}
            scale={[0.104, 0.082, 0.104]}
          />
        )}
        <CallOutText
          position={[0, 2.75, 0]}
          title={"Encoder"}
          value={`${encoderData?.value["00"] ?? "No data"}`}
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
          position={[0, 2.377, 0.916]}
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
          position={[0.744, -0.001, 2.754]}
          scale={[0.188, 0.015, 0.188]}
        />
        <mesh
          name="AcidCilinder"
          geometry={acidCilinder.geometry}
          material={materials["AcidMaterial"]}
          morphTargetDictionary={acidCilinder.morphTargetDictionary}
          morphTargetInfluences={acidMorph}
          position={[1.591, -0.001, 2.996]}
          scale={[0.188, 0.015, 0.188]}
        />
        {barrelAlcaline && (
          <mesh
            geometry={barrelAlcaline.geometry}
            material={barrelAlcaline.material}
            position={[0.835, 0.27, 2.695]}
          />
        )}
        {barrelAcid && (
          <mesh
            geometry={barrelAcid.geometry}
            material={barrelAcid.material}
            position={[1.683, 0.27, 2.937]}
          />
        )}
        <CallOutText
          position={[0.85, 0.9, 2.7]}
          title={"Alcaline"}
          value={weightData?.value ?? 0}
        />
        <CallOutText
          position={[1.7, 0.9, 2.9]}
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
        position={[-0.026, 1.597, -0.122]}
        scale={[2.531, 2.531, 1.974]}
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
        
        {/* Fallback para aspa */}
        <animated.mesh
          position={[0, 0.737, -0.077]}
          scale={0.148}
          rotation={rotationBlade.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        
        {/* Fallback para interruptor */}
        <animated.mesh
          position={[0, 2.377, 0.916]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {/* Fallback para leche */}
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[0, 1.597, 0]} scale={[2.531, 2.531, 1.974]}>
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
          position={[0, 2.75, 0]}
          title={"Encoder"}
          value={`${encoderData?.value["00"] ?? "No data"}`}
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
        position={[0.548, 0.399, -1.164]}
        scale={[1, 1, 0.755]}
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

// ===== TANQUE VERTICAL 1 ASPA =====
export function VerticalTank1Blade({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
}: BaseTankProps) {
  const { nodes, materials } = useGLTF("/verticalTankModel/verticalTank1Blade.glb");

  const rotationBlade = useSpring({
    loop: true,
    to: { rotation: [0, Math.PI * 2, 0] },
    from: { rotation: [0, 0, 0] },
    config: { duration: getRotationDuration(encoderData?.value["01"] ?? 0) },
  });

  const { rotation: rotationHatch } = useSpring({
    to: {
      rotation: switchStatus?.value ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
    },
    config: { duration: 1000 },
  });
  
  const renderMilkQuantity = () => {
    if (milkQuantityData == null) return null;

    const milkNode = nodes.MilkCilinder as any;
    
    if (!milkNode) {
      console.log("❌ MilkCilinder node not found, trying fallback nodes");
      const fallbackNodes = ['MilkCylinder', 'Milk', 'MilkCilinder'];
      
      for (const fallbackKey of fallbackNodes) {
        const fallbackNode = nodes[fallbackKey] as any;
        if (fallbackNode) {
          console.log(`✅ Using fallback node: ${fallbackKey}`);
          const morphInfluence = Math.min(Math.max((milkQuantityData?.value ?? 0) / 100, 0), 1);
          
          return (
            <mesh
              name={fallbackKey}
              geometry={fallbackNode.geometry}
              material={materials.MilkMaterial || materials["MilkMaterial"]}
              morphTargetDictionary={fallbackNode.morphTargetDictionary}
              morphTargetInfluences={[morphInfluence]}
              position={[-0.002, 1.398, 0.012]}
              scale={[0.782, 1.311, 0.782]}
            />
          );
        }
      }
      
      console.log("❌ No milk nodes found in model");
      return null;
    }

    const morphInfluence = Math.min(Math.max((milkQuantityData?.value ?? 0) / 100, 0), 1);
  
    return (
      <mesh
        name="MilkCilinder"
        geometry={milkNode.geometry}
        material={materials.MilkMaterial || materials["MilkMaterial"]}
        morphTargetDictionary={milkNode.morphTargetDictionary}
        morphTargetInfluences={[morphInfluence]}
        position={[-0.002, 1.398, 0.012]}
        scale={[0.782, 1.311, 0.782]}
      />
    );
  };

  const renderEncoder = () => {
    const blade = nodes.Blade as any;
    const bladeHat = nodes.BladeHat as any;

    if (!blade) {
      console.log("❌ Blade node not found");
      return null;
    }

    return (
      <>
        <animated.mesh
          geometry={blade.geometry}
          material={materials.BladeMaterial}
          position={[-0.006, 0.495, 0.022]}
          scale={[-0.148, -0.188, -0.148]}
          rotation={rotationBlade.rotation as any}
        />
        {bladeHat && (
          <mesh
            geometry={bladeHat.geometry}
            material={materials.BladeMaterial}
            position={[-0.006, 2.811, 0.019]}
            scale={[0.061, 0.045, 0.061]}
          />
        )}
        <CallOutText
          position={[0, 3.1, 0.4]}
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
          material={materials.HatchMaterial}
          position={[0, 2.79, -0.606]}
          rotation={rotationHatch as any}
        />
        <CallOutText
          position={[0, 3, -0.9]}
          title={"Magnetic Switch"}
          value={`${switchStatus == null ? "No Data" : switchStatus?.value ? "Open" : "Closed"}`}
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
          material={materials.AlcalineMaterial}
          morphTargetDictionary={alcalineCilinder.morphTargetDictionary}
          morphTargetInfluences={alcalineMorph}
          position={[0.824, -0.001, 1.634]}
          scale={[0.188, 0.015, 0.188]}
        />
        <mesh
          name="AcidCilinder"
          geometry={acidCilinder.geometry}
          material={materials.AcidMaterial}
          morphTargetDictionary={acidCilinder.morphTargetDictionary}
          morphTargetInfluences={acidMorph}
          position={[1.671, -0.001, 1.876]}
          scale={[0.188, 0.015, 0.188]}
        />
        {barrelAlcaline && (
          <mesh
            geometry={barrelAlcaline.geometry}
            material={materials.BarrelMaterial}
            position={[0.915, 0.27, 1.575]}
          />
        )}
        {barrelAcid && (
          <mesh
            geometry={barrelAcid.geometry}
            material={materials.BarrelMaterial}
            position={[1.763, 0.27, 1.817]}
          />
        )}
        <CallOutText
          position={[0.85, 0.9, 1.55]}
          title="Alcaline"
          value={weightData?.value ?? 0}
        />
        <CallOutText
          position={[1.7, 0.9, 1.8]}
          title="Acid"
          value={weightData?.value ?? 0}
        />
      </>
    );
  };

  const renderTankTemperatures = () => renderMilkQuantity();

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
        
        {/* Fallback para aspa */}
        <animated.mesh
          position={[-0.006, 0.495, 0.022]}
          scale={[-0.148, -0.188, -0.148]}
          rotation={rotationBlade.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        
        {/* Fallback para interruptor */}
        <animated.mesh
          position={[0, 2.79, -0.606]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {/* Fallback para leche */}
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[-0.002, 1.398, 0.012]} scale={[0.782, 1.311, 0.782]}>
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
          position={[0, 3.1, 0.4]}
          title={"Encoder"}
          value={`${encoderData?.value["01"] ?? "No data"}`}
        />
        <CallOutText
          position={[0, 3, -0.9]}
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
        material={materials.TankMaterial}
        position={[0.391, -0.004, -0.541]}
        scale={[0.31, 0.169, 0.31]}
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

// Preload de modelos
useGLTF.preload("/horizontalTankModel/horizontalTank2Blades.glb");
useGLTF.preload('/horizontalTankModel/horizontalTank1Blade.glb');
useGLTF.preload("./verticalTankModel/verticalTank1Blade.glb");
