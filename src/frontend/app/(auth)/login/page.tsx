/**
 * Página de autenticación (login)
 * Proporciona la interfaz de inicio de sesión con fondo de video
 * Incluye componentes dinámicos para optimizar el rendimiento
 */

'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import UserAuthForm from '@/components/forms/sign-in-form'
import { ScrollArea } from '@/components/ui/scroll-area'

// Importación dinámica de componentes solo del lado del cliente para optimizar SSR
const VideoBackground = dynamic(
  () => import('@/components/layout/video-background'),
  { ssr: false }
)

const ThemeToggle = dynamic(
  () => import('@/components/layout/theme-toggle'),
  { ssr: false }
)

const PwaStatus = dynamic(
  () => import('@/components/pwa/pwa-status'),
  { ssr: false }
)

/**
 * Array de videos de fondo para rotación automática
 * Proporciona variedad visual y mejora la experiencia de usuario
 */
const videos = [
  '/vid/signin/108077-679386057.mp4',
  '/vid/signin/128481-741454888.mp4',
  '/vid/signin/179207-861403607.mp4',
  '/vid/signin/186195-877323695.mp4',
  '/vid/signin/214395.mp4'
]

/**
 * Componente principal de la página de autenticación
 * Gestiona el estado de sesión, redirección automática y renderizado condicional
 * Proporciona una experiencia de login moderna con efectos visuales
 */
export default function AuthenticationPage() {
  const { status } = useSession()
  const router = useRouter()
  
  // Estado para controlar el montaje de componentes del lado del cliente
  const [isMounted, setIsMounted] = useState(false)

  /**
   * Marcar el componente como montado para evitar errores de hidratación
   * Garantiza que los componentes dinámicos se rendericen correctamente
   */
  useEffect(() => {
    setIsMounted(true)
  }, [])

  /**
   * Redirigir automáticamente si el usuario ya está autenticado
   * Previene acceso innecesario a la página de login
   */
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  // Si está autenticado, no mostrar nada para evitar parpadeo
  if (status === 'authenticated') {
    return null // This will prevent the login form from flashing before redirect
  }

  return (
    <ScrollArea className="h-screen w-full">
      <div className="relative min-h-screen flex items-center justify-center lg:justify-end bg-background">
        {/* Fondo con video y overlay */}
        <div className="absolute inset-0">
          {isMounted && <VideoBackground videos={videos} />}
          <div className="absolute inset-0 bg-background/60 dark:bg-background/80" />
        </div>

        {/* Badge de estado PWA en la esquina superior izquierda */}
        {isMounted && (
          <div className="absolute top-4 left-4 z-20">
            <PwaStatus />
          </div>
        )}

        {/* Toggle de tema en la esquina superior derecha */}
        {isMounted && (
          <div className="absolute top-4 right-4 z-20">
            <ThemeToggle />
          </div>
        )}

        {/* Contenedor principal del formulario de login */}
        <div className="relative z-10 w-full max-w-md mx-4 my-9 p-6 bg-background/95 dark:bg-background/90 rounded-lg shadow-xl lg:mx-0 lg:my-0 lg:mr-24">
          {/* Logo y título de la aplicación */}
          <div className="flex items-center justify-center mb-8 mt-3">
            <Image
              src="/logo.svg"
              alt="LactoKeeper Logo"
              width={66}
              height={66}
              className="text-primary mr-4 dark:opacity-80"
            />
            <span className={`text-3xl text-foreground flex flex-col items-center leading-none ${isMounted ? "font-['LT_Saeada']" : "font-sans"}`}>
              LACTO
              <span className="text-primary">KEEPER</span>
            </span>
          </div>

          {/* Contenido del formulario */}
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Iniciar sesión
              </h1>
            </div>

            {/* Formulario de autenticación */}
            <UserAuthForm />

            {/* Mensaje informativo para usuarios sin cuenta */}
            <p className="text-sm text-muted-foreground text-center px-3 py-3 bg-primary/10 rounded">
              En caso de no disponer de una cuenta, contacta con el administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
