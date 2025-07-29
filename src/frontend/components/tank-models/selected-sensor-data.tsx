import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Droplet, ToggleLeft, Compass, Gauge, Weight, Wind } from 'lucide-react';

interface SelectedSensorDataProps {
  selectedData?: string | null;
  encoderData?: { value: { [key: string]: number } };
  milkQuantityData?: { value: number };
  switchStatus?: { value: boolean };
  weightData?: { value: number };
  tankTemperaturesData?: { value: number };
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
        return tankTemperaturesData?.value ? `${tankTemperaturesData.value.toFixed(1)}°C` : "N/A";
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
        const temp = tankTemperaturesData?.value;
        if (!temp) return "text-gray-600";
        return temp > 5 ? "text-red-600" : "text-green-600";
      case "AirQuality":
        const humidity = airQualityData?.value?.humidity;
        if (!humidity) return "text-gray-600";
        return humidity > 70 ? "text-yellow-600" : "text-green-600";
      default:
        return "text-blue-600";
    }
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
      </CardContent>
    </Card>
  );
};

export default SelectedSensorData;