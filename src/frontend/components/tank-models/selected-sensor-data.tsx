import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Droplet, ToggleLeft, Compass, Gauge, Weight, Wind } from 'lucide-react';

interface SelectedSensorDataProps {
  selectedData?: string | null;
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
  mode?: 'realtime' | 'historical';
}

const SelectedSensorData = ({
  selectedData,
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
  mode = 'realtime',
}: SelectedSensorDataProps) => {
  // Debug: Log the received props
  console.log('=== SelectedSensorData Debug ===');
  console.log('Selected Data:', selectedData);
  console.log('Air Quality Data:', airQualityData);
  console.log('Weight Data:', weightData);
  console.log('Tank Temperatures Data:', tankTemperaturesData);
  console.log('Encoder Data:', encoderData);
  console.log('Milk Quantity Data:', milkQuantityData);
  console.log('Switch Status:', switchStatus);

  const getIcon = () => {
    switch (selectedData) {
      case "MilkQuantity": return Droplet;
      case "TankTemperatures": return Thermometer;
      case "MagneticSwitch": return ToggleLeft;
      case "Encoder": return Gauge;
      case "Gyroscope": return Compass;
      case "Weight": return Weight;
      case "AirQuality": return Wind;
      default: return null;
    }
  };

  const getSensorValue = () => {
    switch (selectedData) {
      case "MilkQuantity":
        return milkQuantityData?.value ? `${milkQuantityData.value.toFixed(1)} L` : "N/A";
      case "TankTemperatures":
        // Mostrar temperatura promedio si solo hay un valor, o múltiples temperaturas
        const temps = tankTemperaturesData?.value;
        if (!temps) return "N/A";
        
        const { over_surface_temperature, surface_temperature, submerged_temperature } = temps;
        
        // Si solo hay un valor, mostrarlo
        if (over_surface_temperature !== undefined && surface_temperature === undefined && submerged_temperature === undefined) {
          return `${over_surface_temperature.toFixed(1)}°C`;
        }
        
        // Si hay múltiples valores, mostrar el rango
        const values = [over_surface_temperature, surface_temperature, submerged_temperature].filter((v): v is number => v !== undefined);
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          return `${min.toFixed(1)}°C - ${max.toFixed(1)}°C`;
        }
        
        return "N/A";
      case "MagneticSwitch":
        return switchStatus?.value !== undefined ? (switchStatus.value ? "Activo" : "Inactivo") : "N/A";
      case "Encoder":
        return encoderData?.value?.angle ? `${encoderData.value.angle.toFixed(1)}°` : "N/A";
      case "Weight":
        // Handle both historical and real-time weight data
        if (weightData?.value) {
          // If it's an object (historical data), get the first value
          if (typeof weightData.value === 'object' && weightData.value !== null) {
            const values = Object.values(weightData.value as Record<string, number>);
            if (values.length > 0) {
              return `${values[0].toFixed(1)} kg`;
            }
          }
          // If it's a direct value (real-time data)
          if (typeof weightData.value === 'number') {
            return `${weightData.value.toFixed(1)} kg`;
          }
        }
        return "N/A";
      case "AirQuality":
        // Handle both historical and real-time air quality data
        if (airQualityData?.value) {
          let humidity, temperature;
          
          // If it's an object (historical data), extract humidity and temperature
          if (typeof airQualityData.value === 'object' && airQualityData.value !== null) {
            const airQuality = airQualityData.value as { humidity?: number; temperature?: number };
            humidity = airQuality.humidity;
            temperature = airQuality.temperature;
          } else {
            // If it's a direct value (real-time data), use the value directly
            humidity = airQualityData.value as number;
            temperature = undefined;
          }
          
          if (humidity !== undefined && temperature !== undefined) {
            return `${humidity.toFixed(1)}% / ${temperature.toFixed(1)}°C`;
          } else if (humidity !== undefined) {
            return `${humidity.toFixed(1)}%`;
          } else if (temperature !== undefined) {
            return `${temperature.toFixed(1)}°C`;
          }
        }
        return "N/A";
      default:
        return "N/A";
    }
  };

  const getSensorLabel = () => {
    switch (selectedData) {
      case "MilkQuantity": return "Cantidad de Leche";
      case "TankTemperatures": return "Temperatura del Tanque";
      case "MagneticSwitch": return "Interruptor Magnético";
      case "Encoder": return "Encoder";
      case "Gyroscope": return "Giroscopio";
      case "Weight": return "Peso";
      case "AirQuality": return "Calidad del Aire";
      default: return "";
    }
  };

  const getStatusColor = () => {
    switch (selectedData) {
      case "MagneticSwitch":
        return switchStatus?.value !== undefined ? (switchStatus.value ? "text-green-600" : "text-red-600") : "text-gray-600";
      case "TankTemperatures":
        const temps = tankTemperaturesData?.value;
        if (!temps) return "text-gray-600";
        
        const { over_surface_temperature, surface_temperature, submerged_temperature } = temps;
        const values = [over_surface_temperature, surface_temperature, submerged_temperature].filter(v => v !== undefined);
        
        if (values.length === 0) return "text-gray-600";
        
        const avgTemp = values.reduce((sum, temp) => sum + temp, 0) / values.length;
        return avgTemp > 5 ? "text-red-600" : "text-green-600";
      case "MilkQuantity":
        return milkQuantityData?.value ? "text-blue-600" : "text-gray-600";
      case "Encoder":
        return encoderData?.value?.angle ? "text-purple-600" : "text-gray-600";
      case "AirQuality":
        if (airQualityData?.value) {
          let humidity, temperature;
          if (typeof airQualityData.value === 'object') {
            humidity = airQualityData.value.humidity;
            temperature = airQualityData.value.temperature;
          } else {
            humidity = airQualityData.value;
            temperature = undefined;
          }
          if (!humidity && !temperature) return "text-gray-600";
          if (humidity !== undefined && temperature === undefined) {
            return humidity > 70 ? "text-yellow-600" : "text-green-600";
          }
          if (temperature !== undefined && humidity === undefined) {
            return temperature > 25 ? "text-red-600" : "text-green-600";
          }
          if (humidity !== undefined && temperature !== undefined) {
            if (humidity > 70 || temperature > 25) return "text-yellow-600";
            return "text-green-600";
          }
          return "text-gray-600";
        }
        return "text-gray-600";
      case "Weight":
        if (weightData?.value) {
          let weight: number | undefined;
          if (typeof weightData.value === 'object' && weightData.value !== null) {
            const values = Object.values(weightData.value as Record<string, number>);
            weight = values.length > 0 ? values[0] : undefined;
          } else if (typeof weightData.value === 'number') {
            weight = weightData.value;
          }
          if (!weight) return "text-gray-600";
          const maxCapacity = 1000;
          const fillPercentage = Math.min((weight / maxCapacity) * 100, 100);
          if (fillPercentage > 90) return "text-red-600";
          if (fillPercentage > 70) return "text-yellow-600";
          return "text-green-600";
        }
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const renderTankTemperatures = () => {
    if (selectedData !== "TankTemperatures" || !tankTemperaturesData) return null;

    const { value } = tankTemperaturesData;
    const { over_surface_temperature, surface_temperature, submerged_temperature } = value || {};

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          {over_surface_temperature !== undefined && (
            <div className="flex justify-between items-center bg-red-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Sobre superficie:</span>
              <span className="font-medium text-red-600">
                {over_surface_temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {surface_temperature !== undefined && (
            <div className="flex justify-between items-center bg-red-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">En superficie:</span>
              <span className="font-medium text-red-600">
                {surface_temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {submerged_temperature !== undefined && (
            <div className="flex justify-between items-center bg-red-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Sumergida:</span>
              <span className="font-medium text-red-600">
                {submerged_temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {!over_surface_temperature && !surface_temperature && !submerged_temperature && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No hay datos de temperatura disponibles
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAirQuality = () => {
    if (selectedData !== "AirQuality" || !airQualityData) return null;

    const { value } = airQualityData;
    let humidity, temperature;
    
    // Handle both historical and real-time data
    if (typeof value === 'object' && value !== null) {
      const airQuality = value as { humidity?: number; temperature?: number };
      humidity = airQuality.humidity;
      temperature = airQuality.temperature;
    } else {
      // For real-time data, use the value directly
      humidity = value as number;
      temperature = undefined;
    }

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          {humidity !== undefined && (
            <div className="flex justify-between items-center bg-blue-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Humedad:</span>
              <span className="font-medium text-blue-600">
                {humidity.toFixed(1)}%
              </span>
            </div>
          )}
          {temperature !== undefined && (
            <div className="flex justify-between items-center bg-orange-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Temperatura:</span>
              <span className="font-medium text-orange-600">
                {temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {humidity === undefined && temperature === undefined && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No hay datos de calidad del aire disponibles
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeight = () => {
    if (selectedData !== "Weight" || !weightData) return null;

    const { value } = weightData;
    let weight: number | undefined;

    // Handle both historical and real-time data
    if (typeof value === 'object' && value !== null) {
      // For historical data, get the first value
      const values = Object.values(value as Record<string, number>);
      weight = values.length > 0 ? values[0] : undefined;
    } else if (typeof value === 'number') {
      // For real-time data, use the value directly
      weight = value;
    }

    if (weight === undefined) {
      return (
        <div className="space-y-2 mt-2">
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay datos de peso disponibles
          </div>
        </div>
      );
    }

    // Calcular porcentaje de llenado (asumiendo capacidad máxima de 1000kg)
    const maxCapacity = 1000;
    const fillPercentage = Math.min((weight / maxCapacity) * 100, 100);
    
    const getFillColor = (percentage: number) => {
      if (percentage < 30) return "bg-green-500";
      if (percentage < 70) return "bg-yellow-500";
      return "bg-red-500";
    };

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center bg-gray-100/30 p-1.5 rounded text-xs">
            <span className="text-muted-foreground">Peso actual:</span>
            <span className="font-medium text-gray-700">
              {weight.toFixed(1)} kg
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Capacidad:</span>
              <span className="font-medium text-gray-700">{fillPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getFillColor(fillPercentage)}`}
                style={{ width: `${fillPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEncoder = () => {
    if (selectedData !== "Encoder" || !encoderData) return null;

    const { value } = encoderData;
    const { angle, position, speed } = value || {};

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          {angle !== undefined && (
            <div className="flex justify-between items-center bg-purple-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Ángulo:</span>
              <span className="font-medium text-purple-600">
                {angle.toFixed(1)}°
              </span>
            </div>
          )}
          {position !== undefined && (
            <div className="flex justify-between items-center bg-indigo-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Posición:</span>
              <span className="font-medium text-indigo-600">
                {(position * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {speed !== undefined && (
            <div className="flex justify-between items-center bg-cyan-100/30 p-1.5 rounded text-xs">
              <span className="text-muted-foreground">Velocidad:</span>
              <span className="font-medium text-cyan-600">
                {speed.toFixed(1)} rpm
              </span>
            </div>
          )}
          {!angle && !position && !speed && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No hay datos de encoder disponibles
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMilkQuantity = () => {
    if (selectedData !== "MilkQuantity" || !milkQuantityData) return null;

    const { value } = milkQuantityData;
    const quantity = value;

    if (quantity === undefined) {
      return (
        <div className="space-y-2 mt-2">
          <div className="text-xs text-muted-foreground text-center py-2">
            No hay datos de cantidad de leche disponibles
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center bg-blue-100/30 p-1.5 rounded text-xs">
            <span className="text-muted-foreground">Cantidad actual:</span>
            <span className="font-medium text-blue-600">
              {quantity.toFixed(1)} L
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderMagneticSwitch = () => {
    if (selectedData !== "MagneticSwitch" || !switchStatus) return null;

    const { value } = switchStatus;
    const isActive = value;

    return (
      <div className="space-y-2 mt-2">
        <div className="space-y-1">
          <div className={`flex justify-between items-center p-1.5 rounded text-xs ${
            isActive 
              ? 'bg-green-100/30' 
              : 'bg-red-100/30'
          }`}>
            <span className="text-muted-foreground">Estado:</span>
            <span className={`font-medium ${
              isActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedData) return null;

  const IconComponent = getIcon();

  // Verificar si estamos en modo histórico sin datos seleccionados
  const hasHistoricalData = encoderData || milkQuantityData || switchStatus || weightData || tankTemperaturesData || airQualityData;
  
  // Si no hay datos y estamos en modo histórico, mostrar mensaje informativo
  if (mode === 'historical' && !hasHistoricalData && selectedData) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {IconComponent && (
              <div className="p-1.5 bg-blue-100 rounded-md">
                <IconComponent className="h-4 w-4 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">{getSensorLabel()}</p>
              <p className="text-sm font-semibold text-gray-500">
                Selecciona un período de tiempo para ver los datos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <div className="p-1.5 bg-blue-100 rounded-md">
              <IconComponent className="h-4 w-4 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600">{getSensorLabel()}</p>
            <p className={`text-sm font-semibold ${getStatusColor()}`}>
              {getSensorValue()}
            </p>
          </div>
        </div>
        
        {/* Renderizar detalles específicos del sensor */}
        {renderTankTemperatures()}
        {renderAirQuality()}
        {renderWeight()}
        {renderEncoder()}
        {renderMilkQuantity()}
        {renderMagneticSwitch()}
      </CardContent>
    </Card>
  );
};

export default SelectedSensorData;