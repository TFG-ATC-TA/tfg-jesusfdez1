'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 landscape:py-1 text-center mx-5 md:mx-0">
      <div className="max-w-2xl">
        
        <div className="mb-8 landscape:mb-4 flex flex-col items-center justify-center gap-4 landscape:gap-2 landscape:flex-row md:flex-row md:gap-8">
          <div className="relative w-full max-w-[10rem] aspect-square sm:max-w-[10rem] md:max-w-[12rem] lg:max-w-[24rem] landscape:max-w-[9rem] sm:landscape:max-w-[10rem] md:landscape:max-w-[12rem]">
            
            <Image
              src="/img/error.png"
              alt="Error illustration"
              fill
              priority
              quality={100}
              sizes="(max-width: 640px) 10rem, (max-width: 768px) 10rem, (max-width: 1024px) 12rem, 24rem"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle 
              className="h-16 w-16 text-yellow-500 mb-2 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32"
              aria-hidden="true"
            />
          </div>
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">Ha ocurrido un error</h1>
        <p className="mb-4 text-muted-foreground md:text-lg">
          Lo sentimos, algo ha salido mal en la aplicación.
        </p>
        <p className="mb-8 text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
          {error.message || 'Error desconocido'}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default" size="lg" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar de nuevo
          </Button>
          <Button onClick={() => router.back()} variant="outline" size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>
          <Button onClick={() => router.push('/')} variant="outline" size="lg" className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </main>
  )
}
