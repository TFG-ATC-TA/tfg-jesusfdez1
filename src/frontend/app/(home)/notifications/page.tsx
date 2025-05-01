"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Farm } from '@/types/index';
import PageContainer from '@/components/layout/page-container';
import NotificationsList from '@/components/ui/notifications-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

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

  // Datos mock de notificaciones para mostrar estadísticas
  const mockNotifications = [
    { id: '1', type: 'info', read: false },
    { id: '2', type: 'warning', read: false },
    { id: '3', type: 'error', read: false },
    { id: '4', type: 'info', read: true },
    { id: '5', type: 'warning', read: true },
    { id: '6', type: 'warning', read: true },
    { id: '7', type: 'error', read: false },
    { id: '8', type: 'info', read: false },
    { id: '9', type: 'warning', read: false },
    { id: '10', type: 'error', read: true }
  ];

  const calculateNotificationStats = () => {
    const stats = {
      total: mockNotifications.length,
      info: mockNotifications.filter(n => n.type === 'info').length,
      warning: mockNotifications.filter(n => n.type === 'warning').length,
      error: mockNotifications.filter(n => n.type === 'error').length,
      unread: mockNotifications.filter(n => !n.read).length
    };
    setNotificationsStats(stats);
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
    calculateNotificationStats();
  }, []);
  
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
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
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
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-2 lg:p-3">
            <div className="flex items-center justify-between lg:items-center lg:justify-between">
              <div className="flex-1 lg:flex-none">
                <p className="text-xs lg:text-sm font-medium text-muted-foreground mb-0.5">Info</p>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{notificationsStats.info}</p>
              </div>
              <div className="w-6 h-6 lg:w-10 lg:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Info className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones de advertencia */}
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
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
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
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
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
            </div>
            </PageContainer>
    </>
  );
};
export default UserClient;
