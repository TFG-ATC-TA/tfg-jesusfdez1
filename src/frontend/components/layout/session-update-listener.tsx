/**
 * Componente de escucha de actualizaciones de sesión
 * Maneja la sincronización automática entre cambios de perfil y sesión
 * No renderiza nada visible, solo proporciona funcionalidad de escucha
 */

'use client';

import { useAutoSessionUpdate } from '@/services/data-service';

/**
 * Componente que escucha actualizaciones de perfil de usuario
 * Actualiza automáticamente la sesión cuando ocurre un evento 'user-profile-updated'
 * No renderiza nada visible, solo proporciona funcionalidad de escucha
 */
export function SessionUpdateListener() {
  // Este hook se encarga de actualizar la sesión cuando ocurre un evento 'user-profile-updated'
  useAutoSessionUpdate();
  
  return null; // Este componente no renderiza nada visible
}
