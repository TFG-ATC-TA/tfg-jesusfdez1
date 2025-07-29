import { Points, PointMaterial } from '@react-three/drei';
import { useMemo, useCallback } from 'react';
import * as THREE from 'three';

function createCircleTexture() {
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

interface ParticleFieldProps {
  particleCount?: number;
  zone?: { x: [number, number]; y: [number, number]; z: [number, number] };
  humidity?: number;
  temperature?: number;
}

export default function ParticleField({ 
  particleCount = 1000, 
  zone = { x: [-3, 5], y: [-5, 5], z: [-5, 5] },
  humidity = 50,
  temperature = 20
}: ParticleFieldProps) {
  const positions = useMemo(() => {
    const temp = [];
    const { x: [xmin, xmax], y: [ymin, ymax], z: [zmin, zmax] } = zone;
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * (xmax - xmin) + xmin;
      const y = Math.random() * (ymax - ymin) + ymin;
      const z = Math.random() * (zmax - zmin) + zmin;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, [particleCount, zone]);

  const circleTexture = useMemo(() => createCircleTexture(), []);

  const getParticleSize = useCallback(() => {
    return 0.05 * (1 + (humidity - 50) / 100);
  }, [humidity]);

  const getParticleColor = useCallback(() => {
    const t = Math.max(0, Math.min(40, temperature)) / 40;
    return new THREE.Color(t, 0, 1 - t);
  }, [temperature]);

  return (
    <Points positions={positions}>
      <PointMaterial
        map={circleTexture}
        transparent={true}
        alphaTest={0.5}
        size={getParticleSize()}
        color={getParticleColor()}
      />
    </Points>
  );
} 