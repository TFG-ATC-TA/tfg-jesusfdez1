/**
 * Utilidades generales para la aplicación
 * Incluye funciones de ayuda para manejo de clases CSS
 * Proporciona herramientas comunes para desarrollo frontend
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Función para combinar clases CSS de manera inteligente
 * Combina clsx y tailwind-merge para manejar conflictos de clases
 * Optimiza las clases CSS eliminando duplicados y resolviendo conflictos
 * @param inputs - Array de valores de clase (strings, objetos, arrays)
 * @returns String con las clases combinadas y optimizadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
