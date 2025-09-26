/**
 * Datos de configuración para la aplicación
 * Incluye elementos de navegación, colores de roles y dispositivos
 * Define la estructura visual y funcional del sistema
 */

import { NavItem } from '@/types';
import { Tractor, Users, TabletSmartphone, Bell, TestTube } from 'lucide-react';

/**
 * Elementos de navegación para el menú lateral
 * Define los elementos del menú con sus iconos, rutas y permisos
 * Cada elemento incluye descripción para mejor UX
 */
export const navItems: NavItem[] = [
    { name: 'Granjas', icon: Tractor, href: '/farms', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'], description: 'Gestiona las granjas y visualiza su información' },
    { name: 'Usuarios', icon: Users, href: '/users', roles: ['Administrador'], description: 'Administra los usuarios del sistema' },
    { name: 'Dispositivos', icon: TabletSmartphone, href: '/devices', roles: ['Administrador'], description: 'Administra los dispositivos del sistema' },
    { name: 'Notificaciones', icon: Bell, href: '/notifications', roles: ['Administrador', 'Ganadero', 'Veterinario', 'Industria'], description: 'Accede a las notificaciones del sistema' },
  ];

/**
 * Colores asociados a cada rol de usuario
 * Se usan para identificar visualmente los diferentes roles
 * Proporciona consistencia visual en toda la aplicación
 */
export const roleColors: { [key: string]: string } = {
  'Administrador': '#3B28B3', // Color primario (azul oscuro)
  'Ganadero': '#02864A',    // Verde oscuro
  'Veterinario': '#E8083E', // Rojo
  'Industria': '#FB8D1A',   // Marrón
};

/**
 * Colores asociados a cada tipo de dispositivo
 * Se usan para identificar visualmente los diferentes tipos de dispositivos
 * Facilita la identificación rápida en interfaces de usuario
 */
export const devicesColors: { [key: string]: string } = {
  'Monitor de tanque': '#A52A2A', 
  'Monitor de estación de lavado': '#8A2BE2', // Marrón
  'Monitor de leche': '#808080', // Gris
};

//'Monitor de leche': '#', // Naranja
//'Monitor de tanque': '#A52A2A', // Verde claro
//'Monitor de estación de lavado': '#FF00FF', // Azul
