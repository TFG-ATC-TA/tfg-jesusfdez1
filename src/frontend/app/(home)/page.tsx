/**
 * Página principal del dashboard
 * Muestra el saludo personalizado y las opciones de navegación disponibles
 * Gestiona el estado del usuario y filtra las opciones según el rol
 * Proporciona una interfaz intuitiva para acceder a todas las funcionalidades
 */

'use client'

import { useSession } from "next-auth/react"
import PageContainer from '@/components/layout/page-container';
import { navItems } from '@/constants/data'
import { Settings } from 'lucide-react'
import { motion } from "framer-motion"
import { AuroraBackground } from "@/components/layout/aurora-background"
import { useState, useEffect } from "react";
import { useUserProfileUpdates, UserProfileUpdate, getUserLocalData } from '@/services/user-service';

/**
 * Componente principal de la página de inicio
 * Renderiza el dashboard con navegación personalizada según el rol del usuario
 * Gestiona la persistencia de datos de usuario y actualizaciones en tiempo real
 * Implementa animaciones fluidas y diseño responsivo
 */
export default function Component() {
  const { data: session } = useSession();
  
  // Estado local para los datos del usuario con valores por defecto
  // Mantiene los datos del usuario sincronizados entre componentes
  const [userData, setUserData] = useState({
    name: '',
    surname: '',
    role: ''
  });
  
  // Solo mostrar nombre si tiene 16 o menos caracteres para evitar desbordamiento
  // Garantiza una presentación visual limpia en dispositivos móviles
  const displayName = userData.name && userData.name.length <= 16 ? userData.name : '';
  const userRole = userData.role || 'Usuario';

  /**
   * Inicializar datos de usuario desde localStorage o sesión
   * Prioriza los datos locales sobre los de la sesión para persistencia
   * Garantiza que los datos del usuario estén disponibles inmediatamente
   * Evita parpadeos de contenido durante la carga inicial
   */
  useEffect(() => {
    const localData = getUserLocalData();
    
    if (localData) {
      // Si hay datos en localStorage, tienen prioridad
      setUserData(prev => ({
        ...prev,
        name: localData.name || prev.name,
        surname: localData.surname || prev.surname,
        role: localData.role || prev.role
      }));
    } else if (session?.user) {
      // Si no hay datos en localStorage, usar los de la sesión
      setUserData({
        name: session.user.name || '',
        surname: session.user.surname || '',
        role: session.user.role || ''
      });
    }
  }, [session]);

  /**
   * Suscribirse a actualizaciones del perfil de usuario
   * Actualiza los datos cuando se modifica el perfil desde otros componentes
   * Mantiene la sincronización entre diferentes partes de la aplicación
   * Permite actualizaciones en tiempo real sin recargar la página
   */
  useUserProfileUpdates((updatedData: UserProfileUpdate) => {
    setUserData(prev => ({
      ...prev,
      ...updatedData
    }));
  });

  /**
   * Escuchar el evento user-data-changed para actualizaciones directas
   * Maneja cambios de datos desde otros componentes mediante eventos personalizados
   * Permite comunicación entre componentes sin dependencias directas
   * Proporciona una capa adicional de sincronización de datos
   */
  useEffect(() => {
    const handleUserDataChanged = (event: CustomEvent<UserProfileUpdate>) => {
      setUserData(prev => ({
        ...prev,
        ...event.detail
      }));
    };

    window.addEventListener(
      'user-data-changed',
      handleUserDataChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        'user-data-changed',
        handleUserDataChanged as EventListener
      );
    };
  }, []);

  /**
   * Filtrar elementos de navegación según el rol del usuario
   * Solo muestra las opciones a las que tiene acceso según sus permisos
   * Garantiza que los usuarios solo vean funcionalidades autorizadas
   * Implementa control de acceso basado en roles (RBAC)
   */
  const allowedNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <AuroraBackground>
    <PageContainer scrollable={true}>
        <div className="w-full mt-10 sm:mb-0 mb-20"> {/* Added margin at the bottom for mobile */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="space-y-6 mb-4 sm:space-y-12 mt-10 sm:mt-0 overflow-hidden" // Added overflow-hidden to prevent extra scrollbar
          >
            {/* Saludo personalizado con animación */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Hola {displayName} 
              </h1>
              <p className="mt-2 sm:mt-4 text-base sm:text-xl text-gray-600 dark:text-neutral-200 font-light">
                Tu espacio personal para gestionar la información de tus granjas
              </p>
            </div>
          
            {/* Contenedor principal con opciones de navegación */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="bg-white/40 backdrop-blur-md dark:bg-black/20 text-gray-800 dark:text-white rounded-lg p-6 mx-auto overflow-hidden" // Added overflow-hidden to prevent double scrollbars
            >
              <p className="text-gray-600 dark:text-neutral-200 mb-4 justify-center text-center text-light">
                Selecciona una de las <span className="font-bold">opciones</span> para acceder a las distintas secciones de la web
              </p>
              
              {/* Grid de opciones de navegación con animaciones escalonadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {allowedNavItems.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-md dark:bg-black/40 rounded-lg p-4 hover:bg-gray-50/90 dark:hover:bg-black/50 transition-all border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center mt-[-2px]">
                        <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                      </div>
                      <h3 className="font-bold mb-2 text-lg text-gray-900 dark:text-white">{item.name}</h3>
                    </div>
                    <p className="text-md text-gray-600 dark:text-neutral-200">{item.description}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Opción de ajustes de usuario con animación retrasada */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6 bg-white/80 backdrop-blur-md dark:bg-black/40 rounded-lg p-4 hover:bg-gray-50/90 dark:hover:bg-black/50 transition-all border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center mt-[-2px]">
                    <Settings className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-gray-900 dark:text-white">Ajustes de usuario</h3>
                </div>
                <p className="text-md text-gray-600 dark:text-neutral-200">
                  Haz clic en tu avatar en la esquina inferior izquierda para acceder a los ajustes de usuario
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </PageContainer>
    </AuroraBackground>
  )
}
