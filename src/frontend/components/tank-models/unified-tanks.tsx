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

// ===== UTILIDADES COMPARTIDAS =====

// Función helper para renderizar leche con fallbacks
const renderMilkWithFallback = (
  nodes: any, 
  materials: any, 
  milkQuantityData: any, 
  position: [number, number, number], 
  scale: [number, number, number]
) => {
  const range = getVisibleMilkCilinder(milkQuantityData?.value ?? 0);
  if (!range) return null;

  const nodeKey = `MilkCilinder${range.max}`;
  const node = nodes[nodeKey] as any;
  
  if (!node) {
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
        return (
          <mesh
            geometry={fallbackNode.geometry}
            material={materials["MilkMaterial"] || materials.MilkMaterial}
            position={position}
            scale={scale}
          />
        );
      }
    }
    
    return null;
  }
  
  return (
    <mesh
      geometry={node.geometry}
      material={materials["MilkMaterial"] || materials.MilkMaterial}
      position={position}
      scale={scale}
    />
  );
};

// Función helper para renderizar aspas con animación
const renderAnimatedBlade = (
  blade: any,
  material: any,
  position: [number, number, number],
  scale: number | [number, number, number],
  rotation: any,
  bladeHat?: any,
  hatPosition?: [number, number, number],
  hatScale?: [number, number, number]
) => {
  if (!blade) return null;

  return (
    <>
      <animated.mesh
        geometry={blade.geometry}
        material={material}
        position={position}
        scale={scale}
        rotation={rotation}
      />
      {bladeHat && hatPosition && hatScale && (
        <mesh
          geometry={bladeHat.geometry}
          material={material}
          position={hatPosition}
          scale={hatScale}
        />
      )}
    </>
  );
};

// Función helper para renderizar interruptor magnético
const renderMagneticSwitchHelper = (
  hatch: any,
  material: any,
  position: [number, number, number],
  rotation: any,
  callOutPosition: [number, number, number],
  switchStatus: any
) => {
  if (!hatch) return null;

  return (
    <>
      <animated.mesh
        geometry={hatch.geometry}
        material={material}
        position={position}
        rotation={rotation}
      />
      <CallOutText
        position={callOutPosition}
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

// Función helper para renderizar peso (alcalina y ácido)
const renderWeightHelper = (
  nodes: any,
  materials: any,
  weightData: any,
  positions: {
    alcaline: [number, number, number];
    acid: [number, number, number];
    barrelAlcaline: [number, number, number];
    barrelAcid: [number, number, number];
    callOutAlcaline: [number, number, number];
    callOutAcid: [number, number, number];
  }
) => {
  const { alcalineMorph, acidMorph } = getAlcalineAcidCylinders({
    quantity: weightData?.value ?? 0,
    maxValue: 100,
  });

  const alcalineCilinder = nodes.AlcalineCilinder as any;
  const acidCilinder = nodes.AcidCilinder as any;
  const barrelAlcaline = nodes.BarrelAlcaline as any;
  const barrelAcid = nodes.BarrelAcid as any;

  if (!alcalineCilinder || !acidCilinder) return null;

  return (
    <>
      <mesh
        name="AlcalineCilinder"
        geometry={alcalineCilinder.geometry}
        material={materials["AlcalineMaterial"]}
        morphTargetDictionary={alcalineCilinder.morphTargetDictionary}
        morphTargetInfluences={alcalineMorph}
        position={positions.alcaline}
        scale={[0.19, 0.01, 0.19]}
      />
      <mesh
        name="AcidCilinder"
        geometry={acidCilinder.geometry}
        material={materials["AcidMaterial"]}
        morphTargetDictionary={acidCilinder.morphTargetDictionary}
        morphTargetInfluences={acidMorph}
        position={positions.acid}
        scale={[0.19, 0.01, 0.19]}
      />
      {barrelAlcaline && (
        <mesh
          geometry={barrelAlcaline.geometry}
          material={barrelAlcaline.material}
          position={positions.barrelAlcaline}
        />
      )}
      {barrelAcid && (
        <mesh
          geometry={barrelAcid.geometry}
          material={barrelAcid.material}
          position={positions.barrelAcid}
        />
      )}
      <CallOutText
        position={positions.callOutAlcaline}
        title={"Alcaline"}
        value={weightData?.value ?? 0}
      />
      <CallOutText
        position={positions.callOutAcid}
        title={"Acid"}
        value={weightData?.value ?? 0}
      />
    </>
  );
};

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
export function HorizontalTank2Blades(props: TankWithStatesProps) {
  const {
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
  } = props;

  const { nodes, materials, scene } = useGLTF("/horizontalTankModel/horizontalTank2Blades.glb");
  const currentConfig = tankStateConfig[currentTankState as keyof typeof tankStateConfig] || tankStateConfig['EMPTY TANK'];

  useEffect(() => {}, [nodes, materials, scene]);

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
      rotation: switchStatus?.value || false ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
    },
    config: { duration: 1000 },
  });

  const renderMilkQuantity = () => 
    renderMilkWithFallback(nodes, materials, milkQuantityData, [-0.026, 1.597, -0.096], [2.531, 2.531, 2.615]);

  const renderEncoder = () => {
    const blade1 = nodes.Blade1 as any;
    const blade2 = nodes.Blade2 as any;
    const blade1Hat = nodes.Blade1Hat as any;
    const blade2Hat = nodes.Blade2Hat as any;

    if (!blade1 || !blade2) return null;

    return (
      <>
        {renderAnimatedBlade(
          blade2,
          materials["BladeMaterial"],
          [0, 0.737, 0.918],
          -0.148,
          rotationBlade1.rotation,
          blade2Hat,
          [-0.003, 2.451, 0.916],
          [0.107, 0.078, 0.107]
        )}
        {renderAnimatedBlade(
          blade1,
          materials["BladeMaterial"],
          [0, 0.737, -0.982],
          -0.148,
          rotationBlade2.rotation,
          blade1Hat,
          [-0.003, 2.451, -0.988],
          [0.104, 0.076, 0.104]
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

  const renderMagneticSwitch = () => 
    renderMagneticSwitchHelper(
      nodes.Hatch,
      materials["HatchMaterial"],
      [0, 2.377, -0.206],
      rotationHatch,
      [0, 2.75, 0],
      switchStatus
    );

  const renderWeight = () => 
    renderWeightHelper(nodes, materials, weightData, {
      alcaline: [1.27, 0, 2.91],
      acid: [1.91, 0, 3.25],
      barrelAlcaline: [1.36, 0.27, 2.85],
      barrelAcid: [2, 0.27, 3.19],
      callOutAlcaline: [1.3, 0.95, 2.8],
      callOutAcid: [2, 0.9, 2.9],
    });

  const renderTankTemperatures = () => renderMilkQuantity();

  const renderAirQuality = () => (
    <ParticleField 
      particleCount={1000} 
      humidity={airQualityData?.value.humidity || 0} 
      temperature={airQualityData?.value.temperature || 0} 
    />
  );

  const tankCilinder = nodes.TankCilinder as any;
  if (!tankCilinder) {
    return (
      <group dispose={null}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[2, 2, 4, 32]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
        
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
        
        <animated.mesh
          position={[0, 2.377, -0.206]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[0, 1.597, 0]} scale={[2.531, 2.531, 2.615]}>
            <cylinderGeometry args={[1, 1, 2, 32]} />
            <meshStandardMaterial color="#f0f8ff" transparent opacity={0.7} />
          </mesh>
        )}
        
        <CallOutText
          position={[0, 3, 0]}
          title={"Error"}
          value={"GLB not loaded"}
        />
        
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
      {(selectedData === "MilkQuantity" || selectedData == null) && renderMilkQuantity()}
      {(selectedData === "Encoder" || selectedData == null) && renderEncoder()}
      {(selectedData === "MagneticSwitch" || selectedData == null) && renderMagneticSwitch()}
      {(selectedData === "Weight" || selectedData == null) && renderWeight()}
      {(selectedData === "TankTemperatures") && renderTankTemperatures()}
      {selectedData === "AirQuality" && renderAirQuality()}
    </group>
  );
}

// ===== TANQUE HORIZONTAL 1 ASPA =====
export function HorizontalTank1Blade(props: BaseTankProps) {
  const {
    encoderData,
    milkQuantityData,
    switchStatus,
    weightData,
    tankTemperaturesData,
    airQualityData,
    selectedData,
  } = props;

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

  const renderMilkQuantity = () => 
    renderMilkWithFallback(nodes, materials, milkQuantityData, [-0.026, 1.597, -0.122], [2.531, 2.531, 1.974]);

  const renderEncoder = () => {
    const blade = nodes.Blade as any;
    const bladeHat = nodes.BladeHat as any;

    if (!blade) return null;

    return (
      <>
        {renderAnimatedBlade(
          blade,
          materials["BladeMaterial"],
          [0, 0.737, -0.077],
          -0.148,
          rotationBlade.rotation,
          bladeHat,
          [0, 2.451, -0.081],
          [0.104, 0.082, 0.104]
        )}
        <CallOutText
          position={[0, 2.75, 0]}
          title={"Encoder"}
          value={`${encoderData?.value["00"] ?? "No data"}`}
        />
      </>
    );
  };

  const renderMagneticSwitch = () => 
    renderMagneticSwitchHelper(
      nodes.Hatch,
      materials["HatchMaterial"],
      [0, 2.377, 0.916],
      rotationHatch,
      [0, 2.75, 0],
      switchStatus
    );

  const renderWeight = () => 
    renderWeightHelper(nodes, materials, weightData, {
      alcaline: [0.744, -0.001, 2.754],
      acid: [1.591, -0.001, 2.996],
      barrelAlcaline: [0.835, 0.27, 2.695],
      barrelAcid: [1.683, 0.27, 2.937],
      callOutAlcaline: [0.85, 0.9, 2.7],
      callOutAcid: [1.7, 0.9, 2.9],
    });

  const renderTankTemperatures = () => renderMilkQuantity();

  const renderAirQuality = () => (
    <ParticleField 
      particleCount={1000} 
      humidity={airQualityData?.value.humidity || 0} 
      temperature={airQualityData?.value.temperature || 0} 
    />
  );

  const tankCilinder = nodes.TankCilinder as any;
  if (!tankCilinder) {
    return (
      <group dispose={null}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[2, 2, 4, 32]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
        
        <animated.mesh
          position={[0, 0.737, -0.077]}
          scale={0.148}
          rotation={rotationBlade.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        
        <animated.mesh
          position={[0, 2.377, 0.916]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[0, 1.597, 0]} scale={[2.531, 2.531, 1.974]}>
            <cylinderGeometry args={[1, 1, 2, 32]} />
            <meshStandardMaterial color="#f0f8ff" transparent opacity={0.7} />
          </mesh>
        )}
        
        <CallOutText
          position={[0, 3, 0]}
          title={"Error"}
          value={"GLB not loaded"}
        />
        
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
      {(selectedData === "MilkQuantity" || selectedData == null) && renderMilkQuantity()}
      {(selectedData === "Encoder" || selectedData == null) && renderEncoder()}
      {(selectedData === "MagneticSwitch" || selectedData == null) && renderMagneticSwitch()}
      {(selectedData === "Weight" || selectedData == null) && renderWeight()}
      {(selectedData === "TankTemperatures") && renderTankTemperatures()}
      {selectedData === "AirQuality" && renderAirQuality()}
    </group>
  );
}

// ===== TANQUE VERTICAL 1 ASPA =====
export function VerticalTank1Blade(props: BaseTankProps) {
  const {
    encoderData,
    milkQuantityData,
    switchStatus,
    weightData,
    tankTemperaturesData,
    airQualityData,
    selectedData,
  } = props;

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
      const fallbackNodes = ['MilkCylinder', 'Milk', 'MilkCilinder'];
      
      for (const fallbackKey of fallbackNodes) {
        const fallbackNode = nodes[fallbackKey] as any;
        if (fallbackNode) {
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

    if (!blade) return null;

    return (
      <>
        {renderAnimatedBlade(
          blade,
          materials.BladeMaterial,
          [-0.006, 0.495, 0.022],
          [-0.148, -0.188, -0.148],
          rotationBlade.rotation,
          bladeHat,
          [-0.006, 2.811, 0.019],
          [0.061, 0.045, 0.061]
        )}
        <CallOutText
          position={[0, 3.1, 0.4]}
          title={"Encoder"}
          value={`${encoderData?.value["01"] ?? "No data"}`}
        />
      </>
    );
  };

  const renderMagneticSwitch = () => 
    renderMagneticSwitchHelper(
      nodes.Hatch,
      materials.HatchMaterial,
      [0, 2.79, -0.606],
      rotationHatch,
      [0, 3, -0.9],
      switchStatus
    );

  const renderWeight = () => 
    renderWeightHelper(nodes, materials, weightData, {
      alcaline: [0.824, -0.001, 1.634],
      acid: [1.671, -0.001, 1.876],
      barrelAlcaline: [0.915, 0.27, 1.575],
      barrelAcid: [1.763, 0.27, 1.817],
      callOutAlcaline: [0.85, 0.9, 1.55],
      callOutAcid: [1.7, 0.9, 1.8],
    });

  const renderTankTemperatures = () => renderMilkQuantity();

  const renderAirQuality = () => (
    <ParticleField
      particleCount={1000}
      humidity={airQualityData?.value.humidity || 0}
      temperature={airQualityData?.value.temperature || 0}
    />
  );

  const tankCilinder = nodes.TankCilinder as any;
  if (!tankCilinder) {
    return (
      <group dispose={null}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[2, 2, 4, 32]} />
          <meshStandardMaterial color="#718096" />
        </mesh>
        
        <animated.mesh
          position={[-0.006, 0.495, 0.022]}
          scale={[-0.148, -0.188, -0.148]}
          rotation={rotationBlade.rotation as any}
        >
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#4a5568" />
        </animated.mesh>
        
        <animated.mesh
          position={[0, 2.79, -0.606]}
          rotation={rotationHatch as any}
        >
          <boxGeometry args={[1, 0.1, 0.5]} />
          <meshStandardMaterial color="#e53e3e" />
        </animated.mesh>
        
        {(selectedData === "MilkQuantity" || selectedData == null) && (
          <mesh position={[-0.002, 1.398, 0.012]} scale={[0.782, 1.311, 0.782]}>
            <cylinderGeometry args={[1, 1, 2, 32]} />
            <meshStandardMaterial color="#f0f8ff" transparent opacity={0.7} />
          </mesh>
        )}
        
        <CallOutText
          position={[0, 3, 0]}
          title={"Error"}
          value={"GLB not loaded"}
        />
        
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
      {(selectedData === "MilkQuantity" || selectedData == null) && renderMilkQuantity()}
      {(selectedData === "Encoder" || selectedData == null) && renderEncoder()}
      {(selectedData === "MagneticSwitch" || selectedData == null) && renderMagneticSwitch()}
      {(selectedData === "Weight" || selectedData == null) && renderWeight()}
      {(selectedData === "TankTemperatures") && renderTankTemperatures()}
      {selectedData === "AirQuality" && renderAirQuality()}
    </group>
  );
}

// Preload de modelos
useGLTF.preload("/horizontalTankModel/horizontalTank2Blades.glb");
useGLTF.preload('/horizontalTankModel/horizontalTank1Blade.glb');
useGLTF.preload("./verticalTankModel/verticalTank1Blade.glb");
