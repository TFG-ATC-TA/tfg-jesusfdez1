/**
 * Hook para manejo del estado del sidebar (menú lateral)
 * Utiliza Zustand para gestión de estado global del sidebar
 * Proporciona funcionalidad de minimización y toggle del menú
 */

import { create } from 'zustand';

/**
 * Interfaz para el store del sidebar
 * Define el estado y métodos para controlar el sidebar
 * Permite controlar la visibilidad y estado de minimización
 */
interface SidebarStore {
  isMinimized: boolean;
  toggle: () => void;
}

/**
 * Store de Zustand para el sidebar
 * Maneja el estado de minimización del menú lateral
 * Proporciona persistencia de estado entre navegaciones
 */
export const useSidebar = create<SidebarStore>((set) => ({
  isMinimized: false,
  toggle: () => set((state) => ({ isMinimized: !state.isMinimized }))
}));
