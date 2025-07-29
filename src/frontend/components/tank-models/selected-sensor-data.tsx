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
}

const SelectedSensorData = ({
  selectedData,
  encoderData,
  milkQuantityData,
  switchStatus,
  weightData,
  tankTemperaturesData,
  airQualityData,
}: SelectedSensorDataProps) => {

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
        const values = [over_surface_temperature, surface_temperature, submerged_temperature].filter(v => v !== undefined);
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          return `${min.toFixed(1)}°C - ${max.toFixed(1)}°C`;
        }
        
        return "N/A";
      case "MagneticSwitch":
        return switchStatus?.value ? "Activo" : "Inactivo";
      case "Encoder":
        return encoderData?.value?.angle ? `${encoderData.value.angle.toFixed(1)}°` : "N/A";
      case "Weight":
        return weightData?.value ? `${weightData.value.toFixed(1)} kg` : "N/A";
      case "AirQuality":
        return airQualityData?.value ? `${airQualityData.value.humidity.toFixed(1)}%` : "N/A";
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
        return switchStatus?.value ? "text-green-600" : "text-red-600";
      case "TankTemperatures":
        const temps = tankTemperaturesData?.value;
        if (!temps) return "text-gray-600";
        
        const { over_surface_temperature, surface_temperature, submerged_temperature } = temps;
        const values = [over_surface_temperature, surface_temperature, submerged_temperature].filter(v => v !== undefined);
        
        if (values.length === 0) return "text-gray-600";
        
        const avgTemp = values.reduce((sum, temp) => sum + temp, 0) / values.length;
        return avgTemp > 5 ? "text-red-600" : "text-green-600";
      case "AirQuality":
        const humidity = airQualityData?.value?.humidity;
        if (!humidity) return "text-gray-600";
        return humidity > 70 ? "text-yellow-600" : "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  const renderTankTemperatures = () => {
    if (selectedData !== "TankTemperatures" || !tankTemperaturesData) return null;

    const { value, tags, readableDate } = tankTemperaturesData;
    const { over_surface_temperature, surface_temperature, submerged_temperature } = value || {};

    return (
      <div className="space-y-2 mt-2">
        {tags?.board_id && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Board ID:</span>
            <span className="font-medium">{tags.board_id}</span>
          </div>
        )}
        {readableDate && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Última lectura:</span>
            <span className="font-medium">{readableDate}</span>
          </div>
        )}
        
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
        </div>
      </div>
    );
  };

  if (!selectedData) return null;

  const IconComponent = getIcon();

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
        
        {/* Renderizar detalles de temperatura del tanque */}
        {renderTankTemperatures()}
      </CardContent>
    </Card>
  );
};

export default SelectedSensorData;