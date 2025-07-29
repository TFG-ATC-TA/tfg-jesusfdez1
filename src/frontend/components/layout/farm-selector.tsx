import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  deviceCount: number;
  userCount: number;
}

interface FarmSelectorProps {
  className?: string;
  onFarmChange?: (farmId: string) => void;
}

export function FarmSelector({ className, onFarmChange }: FarmSelectorProps) {
  const [farms, setFarms] = useState<Farm[]>([
    {
      id: '1',
      name: 'Granja San Miguel',
      location: 'Madrid, España',
      status: 'active',
      deviceCount: 12,
      userCount: 5
    },
    {
      id: '2',
      name: 'Granja El Roble',
      location: 'Sevilla, España',
      status: 'active',
      deviceCount: 8,
      userCount: 3
    },
    {
      id: '3',
      name: 'Granja Los Pinos',
      location: 'Valencia, España',
      status: 'maintenance',
      deviceCount: 6,
      userCount: 2
    },
    {
      id: '4',
      name: 'Granja La Esperanza',
      location: 'Barcelona, España',
      status: 'inactive',
      deviceCount: 4,
      userCount: 1
    }
  ]);

  const [selectedFarm, setSelectedFarm] = useState<string>('1');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inactive':
        return 'Inactiva';
      default:
        return 'Desconocido';
    }
  };

  const handleFarmChange = (farmId: string) => {
    setSelectedFarm(farmId);
    onFarmChange?.(farmId);
  };

  const selectedFarmData = farms.find(farm => farm.id === selectedFarm);

  return (
    <Card className={`bg-white/80 backdrop-blur-md dark:bg-black/40 border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Seleccionar Granja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedFarm} onValueChange={handleFarmChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una granja" />
          </SelectTrigger>
          <SelectContent>
            {farms.map((farm) => (
              <SelectItem key={farm.id} value={farm.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{farm.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(farm.status)}`}
                  >
                    {getStatusText(farm.status)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedFarmData && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ubicación</span>
              </div>
              <span className="text-sm text-muted-foreground">{selectedFarmData.location}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Dispositivos</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedFarmData.deviceCount} activos
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Usuarios</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedFarmData.userCount} usuarios
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 