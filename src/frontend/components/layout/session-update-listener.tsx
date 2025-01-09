'use client';

import { useAutoSessionUpdate } from '@/services/user-service';

// Este componente no renderiza nada, simplemente escucha actualizaciones de perfil
// y actualiza la sesión automáticamente
export function SessionUpdateListener() {
  // Este hook se encarga de actualizar la sesión cuando ocurre un evento 'user-profile-updated'
  useAutoSessionUpdate();
  
  return null;
}