# Modelo 3D del Tanque

Este directorio contiene los componentes para la visualización 3D del tanque de leche, basados en el trabajo de Daniel López.

## Componentes

### TankModel
Componente principal que renderiza el modelo 3D del tanque. Incluye:
- Soporte para modo tiempo real e histórico
- Funcionalidad de pantalla completa
- Manejo de errores y estados de carga
- Integración con datos de sensores

### HorizontalTank2Blades
Modelo específico del tanque horizontal con 2 aspas. Incluye:
- Animaciones de rotación de aspas basadas en datos del encoder
- Visualización de cantidad de leche
- Estado del interruptor magnético
- Datos de peso (álcali y ácido)
- Temperaturas del tanque
- Calidad del aire con partículas

### CallOutText
Componente para mostrar información flotante en el modelo 3D.

### ParticleField
Componente para efectos de partículas que representan la calidad del aire.

### Transformations
Utilidades para:
- Cálculo de duración de rotación basada en RPM
- Transformaciones de cilindros de álcali y ácido
- Cálculo de cilindros de leche visibles

## Uso

```tsx
import { TankModel } from '@/components/tank-models';

<TankModel
  mode="realtime"
  encoderData={{ value: { "00": 100, "01": 150 } }}
  milkQuantityData={{ value: 75 }}
  switchStatus={{ value: true }}
  weightData={{ value: 50 }}
  tankTemperaturesData={{ value: 25 }}
  airQualityData={{ value: { humidity: 60, temperature: 22 } }}
  selectedData="Encoder"
/>
```

## Dependencias

- `three`: Biblioteca 3D principal
- `@react-three/fiber`: React renderer para Three.js
- `@react-three/drei`: Utilidades para React Three Fiber
- `@react-spring/three`: Animaciones para Three.js

## Notas

- Los modelos GLB originales no están incluidos por su tamaño
- Se usa geometría básica de Three.js como alternativa
- El componente está optimizado para datos en tiempo real
- Soporta diferentes tipos de datos de sensores 