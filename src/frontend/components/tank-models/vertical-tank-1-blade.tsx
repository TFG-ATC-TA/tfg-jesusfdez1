import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import CallOutText from "./call-out-text";
import ParticleField from "./particle-field";
import { getRotationDuration, getAlcalineAcidCylinders } from "./transformations";

interface VerticalTank1BladeProps {
  encoderData?: { value: { [key: string]: number } };
  milkQuantityData?: { value: number };
  switchStatus?: { value: boolean };
  weightData?: { value: number };
  tankTemperaturesData?: { value: number };
  airQualityData?: { value: { humidity: number; temperature: number } };
  selectedData?: string | null;
}

export function VerticalTank1Blade({
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  selectedData,
}: VerticalTank1BladeProps) {
  const { nodes, materials } = useGLTF("./verticalTankModel/verticalTank1Blade.glb");

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

    const morphInfluence = Math.min(Math.max((milkQuantityData?.value ?? 0) / 100, 0), 1);
  
    return (
      <mesh
        name="MilkCilinder"
        geometry={(nodes.MilkCilinder as any).geometry}
        material={materials.MilkMaterial}
        morphTargetDictionary={(nodes.MilkCilinder as any).morphTargetDictionary}
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

useGLTF.preload("./verticalTankModel/verticalTank1Blade.glb"); 