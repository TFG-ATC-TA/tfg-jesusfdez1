'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Home } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

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
            <span
              aria-hidden="true"
              className="bg-gradient-to-b from-foreground to-transparent bg-clip-text text-[5rem] font-extrabold leading-none text-transparent mt-2 sm:text-[4.5rem] md:text-[5.5rem] lg:text-[10rem]"
            >
              404
            </span>
          </div>
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">Algo ha fallado</h1>
        <p className="mb-8 text-muted-foreground md:text-lg">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
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