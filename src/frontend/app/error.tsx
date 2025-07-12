/**
 * Componente de manejo de errores globales
 * Captura errores no manejados en la aplicación y muestra una interfaz amigable
 * Proporciona opciones de navegación para recuperarse del error
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Home } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Componente de error que se ejecuta cuando ocurre un error no manejado
 * @param error - Objeto de error con información del problema
 * @param reset - Función para intentar recuperar el estado anterior
 */
export default function Error({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  /**
   * Registrar el error en la consola para debugging
   * En producción, esto debería enviarse a un servicio de monitoreo
   */
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 landscape:py-1 text-center mx-5 md:mx-0">
      <div className="max-w-2xl">
        
        {/* Imagen ilustrativa del error */}
        <div className="mb-8 landscape:mb-4 flex justify-center">
          <div className="relative w-full max-w-[12rem] aspect-square sm:max-w-[14rem] md:max-w-[16rem] lg:max-w-[20rem] landscape:max-w-[10rem] sm:landscape:max-w-[12rem] md:landscape:max-w-[14rem]">
            <Image
              src="/img/error.png"
              alt="Error illustration"
              fill
              priority
              quality={100}
              sizes="(max-width: 640px) 12rem, (max-width: 768px) 14rem, (max-width: 1024px) 16rem, 20rem"
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Mensaje principal del error */}
        <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">Ha ocurrido un error</h1>
        <p className="mb-4 text-muted-foreground md:text-lg">
          Lo sentimos, algo ha salido mal en la aplicación.
        </p>
        
        {/* Detalles técnicos del error para debugging */}
        <p className="mb-8 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
          {error.message || 'Error desconocido'}
        </p>
        
        {/* Botones de navegación para recuperación */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">

          <Button onClick={() => router.back()} variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>
          <Button onClick={() => router.push('/')} variant="default" size="lg" className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </main>
  )
}
