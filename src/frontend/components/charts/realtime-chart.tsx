import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Thermometer, Droplets } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  time: string;
  value: number;
  unit: string;
}

interface RealtimeChartProps {
  title: string;
  data: DataPoint[];
  color: string;
  icon: React.ReactNode;
  unit: string;
  className?: string;
}

export function RealtimeChart({ title, data, color, icon, unit, className }: RealtimeChartProps) {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    if (data.length > 0) {
      const latest = data[data.length - 1];
      const previous = data[data.length - 2];
      
      setCurrentValue(latest.value);
      
      if (previous) {
        if (latest.value > previous.value) {
          setTrend('up');
        } else if (latest.value < previous.value) {
          setTrend('down');
        } else {
          setTrend('stable');
        }
      }
    }
  }, [data]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className={`bg-white/80 backdrop-blur-md dark:bg-black/40 border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge variant="outline" className="text-xs">
              {currentValue.toFixed(1)} {unit}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className={getTrendColor()}>
            {trend === 'up' ? 'Subiendo' : trend === 'down' ? 'Bajando' : 'Estable'}
          </span>
          {' • '}
          Última actualización: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de ejemplo con datos simulados
export function TemperatureChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Generar datos simulados
    const generateData = () => {
      const now = new Date();
      const newData: DataPoint[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000);
        newData.push({
          time: time.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: Math.random() * 10 + 15, // Entre 15-25°C
          unit: '°C'
        });
      }
      
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <RealtimeChart
      title="Temperatura del Tanque"
      data={data}
      color="#3B82F6"
      icon={<Thermometer className="h-4 w-4" />}
      unit="°C"
    />
  );
}

export function HumidityChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const generateData = () => {
      const now = new Date();
      const newData: DataPoint[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000);
        newData.push({
          time: time.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: Math.random() * 20 + 60, // Entre 60-80%
          unit: '%'
        });
      }
      
      setData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <RealtimeChart
      title="Humedad del Ambiente"
      data={data}
      color="#10B981"
      icon={<Droplets className="h-4 w-4" />}
      unit="%"
    />
  );
} 