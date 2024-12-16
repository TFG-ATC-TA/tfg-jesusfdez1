import { NavItem } from '@/types';
import { Tractor, Users, TabletSmartphone, Bell } from 'lucide-react';

export const navItems: NavItem[] = [
    { name: 'Granjas', icon: Tractor, href: '/dashboard/farms', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'], description: 'Gestiona las granjas y visualiza su información' },
    { name: 'Usuarios', icon: Users, href: '/dashboard/users', roles: ['Administrador'], description: 'Administra los usuarios del sistema' },
    { name: 'Dispositivos', icon: TabletSmartphone, href: '/dashboard/devices', roles: ['Administrador'], description: 'Administra los dispositivos del sistema' },
    { name: 'Notificaciones', icon: Bell, href: '/dashboard/notifications', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'], description: 'Accede a las notificaciones del sistema' },
  ];

export const roleColors: { [key: string]: string } = {
  'Administrador': '#3B28B3', // Color primario (azul oscuro)
  'Ganadero': '#02864A',    // Verde oscuro
  'Veterinario': '#E8083E', // Rojo
  'Industria': '#FB8D1A',   // Marrón
};

export const devicesColors: { [key: string]: string } = {
  'Monitor de tanque': '#A52A2A', 
  'Monitor de estación de lavado': '#8A2BE2', // Marrón
  'Monitor de leche': '#808080', // Gris
};

//'Monitor de leche': '#', // Naranja
//'Monitor de tanque': '#A52A2A', // Verde claro
//'Monitor de estación de lavado': '#FF00FF', // Azul