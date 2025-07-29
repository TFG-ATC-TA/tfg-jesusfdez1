import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Server, Database, Activity } from 'lucide-react';

interface ServerStatusProps {
  className?: string;
}

interface StatusData {
  server: 'online' | 'offline' | 'warning';
  mqtt: 'connected' | 'disconnected' | 'warning';
  database: 'healthy' | 'error' | 'warning';
  websocket: 'connected' | 'disconnected' | 'warning';
}

export function ServerStatus({ className }: ServerStatusProps) {
  const [status, setStatus] = useState<StatusData>({
    server: 'online',
    mqtt: 'connected',
    database: 'healthy',
    websocket: 'connected'
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simular actualizaciones de estado
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      
      // Simular cambios aleatorios de estado
      if (Math.random() > 0.95) {
        setStatus(prev => ({
          ...prev,
          server: Math.random() > 0.8 ? 'warning' : 'online'
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'offline':
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'En línea';
      case 'connected':
        return 'Conectado';
      case 'healthy':
        return 'Saludable';
      case 'warning':
        return 'Advertencia';
      case 'offline':
        return 'Desconectado';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (type: keyof StatusData) => {
    switch (type) {
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'mqtt':
        return <Wifi className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'websocket':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`bg-white/80 backdrop-blur-md dark:bg-black/40 border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Estado del Sistema
          <Badge variant="outline" className="text-xs">
            {lastUpdate.toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(key as keyof StatusData)}
              <span className="text-sm font-medium capitalize">
                {key === 'websocket' ? 'WebSocket' : key}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(value)}`} />
              <span className="text-xs text-muted-foreground">
                {getStatusText(value)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 