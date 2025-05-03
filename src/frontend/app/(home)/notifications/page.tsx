"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Farm } from '@/types/index';
import PageContainer from '@/components/layout/page-container';
import NotificationsList from '@/components/ui/notifications-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UserClient: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<Farm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationsStats, setNotificationsStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    unread: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Información de las tarjetas
  const cardInfo = {
    total: {
      title: "Total de notificaciones",
      description: "Representa el número total de notificaciones generadas por todos los dispositivos y granjas en tu sistema. Incluye notificaciones de información, avisos y errores.",
      icon: CheckCircle,
      color: "blue"
    },
    info: {
      title: "Información general", 
      description: "Notificaciones informativas que proporcionan datos sobre el estado normal de los dispositivos, actualizaciones de sistema, o confirmaciones de operaciones completadas exitosamente.",
      icon: Info,
      color: "green"
    },
    warning: {
      title: "Avisos y advertencias",
      description: "Alertas que requieren atención pero no representan un problema crítico. Pueden indicar condiciones que deben monitorearse o acciones preventivas recomendadas.",
      icon: AlertTriangle,
      color: "yellow"
    },
    error: {
      title: "Errores críticos",
      description: "Notificaciones de alta prioridad que indican problemas críticos en el sistema, fallos de dispositivos, o situaciones que requieren acción inmediata para mantener el funcionamiento óptimo.",
      icon: AlertCircle,
      color: "red"
    }
  };

  const fetchNotificationStats = async () => {
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      return;
    }

    try {
      // Usar la ruta /list con limit=1 solo para obtener estadísticas
      const response = await fetch('http://localhost:5001/notification/list?limit=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de notificaciones');
      }
      
      const data = await response.json();
      setNotificationsStats(data.stats);
    } catch (error) {
      console.error('Error al obtener estadísticas de notificaciones:', error);
    }
  };

    const fetchFarms = async () => {
      if (!session?.accessToken) {
        console.error('No hay sesión iniciada');
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/farm/list', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        });
        if (!response.ok) {
          throw new Error('Error al obtener granjas');
        }
        const fetchedData: Farm[] = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error('Error al obtener granjas:', error);
      }
    };
    
  useEffect(() => {
    fetchFarms();
    fetchNotificationStats();

    // Escuchar actualizaciones de notificaciones desde el componente de lista
    const handleNotificationsUpdate = (event: any) => {
      if (event.detail) {
        setNotificationsStats(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
      return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
    }
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      setIsLoading(false);
    }
  }, [session]);
  
  return (
    <>    
    <PageContainer scrollable={true}>
    <div className="space-y-2  mb-16 md:mb-0">
    <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notificaciones ({notificationsStats.total})</h2>
          <h3 className="text-md text-muted-foreground mt-2 mb-4">
            Visualiza todas las notificaciones de tus granjas
          </h3>
        </div>
      </div>

      {/* Cards de estadísticas de notificaciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-8">
        {/* Total de notificaciones */}
        <Card 
          className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
          onClick={() => setSelectedCard('total')}
        >
          <CardContent className="p-2 lg:p-3">
            <div className="flex items-center justify-between lg:items-center lg:justify-between">
              <div className="flex-1 lg:flex-none">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5">Total</p>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">{notificationsStats.total}</p>
              </div>
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones de información */}
        <Card 
          className="border-l-4 border-l-green-500 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
          onClick={() => setSelectedCard('info')}
        >
          <CardContent className="p-2 lg:p-3">
            <div className="flex items-center justify-between lg:items-center lg:justify-between">
              <div className="flex-1 lg:flex-none">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5">General</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{notificationsStats.info}</p>
              </div>
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Info className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones de advertencia */}
        <Card 
          className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
          onClick={() => setSelectedCard('warning')}
        >
          <CardContent className="p-2 lg:p-3">
            <div className="flex items-center justify-between lg:items-center lg:justify-between">
              <div className="flex-1 lg:flex-none">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5">Avisos</p>
                <p className="text-lg lg:text-2xl font-bold text-yellow-600">{notificationsStats.warning}</p>
              </div>
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 lg:h-5 lg:w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones de error */}
        <Card 
          className="border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
          onClick={() => setSelectedCard('error')}
        >
          <CardContent className="p-2 lg:p-3">
            <div className="flex items-center justify-between lg:items-center lg:justify-between">
              <div className="flex-1 lg:flex-none">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5">Errores</p>
                <p className="text-lg lg:text-2xl font-bold text-red-600">{notificationsStats.error}</p>
              </div>
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-3 w-3 lg:h-5 lg:w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="mb-4">
        <div className="mb-8 flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            {notificationsStats.unread} sin leer
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {notificationsStats.total - notificationsStats.unread} leídas
          </span>
        </div>
      </div>

      <div className="my-4"></div>
      <NotificationsList />

      {/* Modal de información */}
      {selectedCard && (
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 bg-background shadow-xl [&>button]:hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                {(() => {
                  const info = cardInfo[selectedCard as keyof typeof cardInfo];
                  const IconComponent = info.icon;
                  const colorClasses = {
                    blue: "bg-blue-100 text-blue-600",
                    green: "bg-green-100 text-green-600", 
                    yellow: "bg-yellow-100 text-yellow-600",
                    red: "bg-red-100 text-red-600"
                  };
                  return (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[info.color as keyof typeof colorClasses]}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  );
                })()}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {cardInfo[selectedCard as keyof typeof cardInfo].title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                {cardInfo[selectedCard as keyof typeof cardInfo].description}
              </p>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setSelectedCard(null)}
                  className="px-6 py-2"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
            </div>
            </PageContainer>
    </>
  );
};
export default UserClient;
