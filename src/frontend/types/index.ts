/**
 * Definiciones de tipos TypeScript para la aplicación
 * Interfaces que definen la estructura de datos del sistema
 * Proporciona type safety y documentación de la estructura de datos
 */

/**
 * Elemento de navegación para el menú lateral
 * Define la estructura de cada elemento del menú
 * Incluye iconos, rutas y permisos de acceso
 */
export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  description?: string;
}

/**
 * Interfaz para granjas del sistema
 * Representa una granja con sus datos básicos
 * Incluye identificadores únicos y nombres
 */
export interface Farm {
  _id: string;
  name: string;
  idname: string;
}

/**
 * Interfaz para usuarios del sistema
 * Incluye información personal y roles de acceso
 * Define la estructura completa de un usuario autenticado
 */
export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  farms: string[];
}

/**
 * Interfaz para dispositivos IoT
 * Representa dispositivos con sensores y ubicación
 * Incluye información de hardware y configuración
 */
export interface Device {
  _id: string;
  boardId: string;
  type: string;
  farm: string;
  equipment: string;
  description: string;
  sensors: {
    sensorId: string;
    name: string;
  }[];
}

/**
 * Interfaz para tanques asociados a equipos
 * Representa tanques que pueden ser asignados a equipos
 * Incluye información básica del tanque
 */
export interface AssociatedTank {
  _id: string;
  name: string;
  capacity: number;
}

/**
 * Interfaz para equipos de la granja
 * Incluye tanques de leche y estaciones de lavado
 * Define la relación entre equipos y dispositivos
 */
export interface Equipment {
  _id: string;
  name: string;
  type: string;
  deviceCount: number;
  farm?: string;
  device?: string[];
  associatedTanks?: string[];
}

/**
 * Interfaz para recolección de leche
 * Datos completos de una sesión de recolección
 * Incluye información de temperatura, volúmenes y muestras
 */
export interface MilkCollection {
  _id: string;
  collectionDate: Date;
  cisternLicensePlate: string;
  collectionCompany: string;
  driver: string;
  tankId: string;
  sampleLabel: string;
  milkTemperature: number;
  inhibitorSampleTaken: boolean;
  litersPerTank: {
    tankId: string;
    liters: number;
    compartment: string;
  }[];
}