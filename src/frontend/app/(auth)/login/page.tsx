'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import UserAuthForm from '@/components/forms/sign-in-form'
import VideoBackground from '@/components/layout/video-background'
import { ScrollArea } from '@/components/ui/scroll-area'
import ThemeToggle from '@/components/layout/theme-toggle';

const videos = [
  '/vid/signin/108077-679386057.mp4',
  '/vid/signin/128481-741454888.mp4',
  '/vid/signin/179207-861403607.mp4',
  '/vid/signin/186195-877323695.mp4',
  '/vid/signin/214395.mp4'
]

export default function AuthenticationPage() {
  const { status } = useSession()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'authenticated') {
    return null // This will prevent the login form from flashing before redirect
  }

  return (
    <ScrollArea className="h-screen w-full">
      <div className="relative min-h-screen flex items-center justify-center lg:justify-end bg-background">
        <div className="absolute inset-0">
          {isMounted && <VideoBackground videos={videos} />}
          <div className="absolute inset-0 bg-background/60 dark:bg-background/80" />
        </div>
        
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        
        <div className="relative z-10 w-full max-w-md mx-4 my-8 p-6 bg-background/95 dark:bg-background/90 rounded-lg shadow-xl lg:mx-0 lg:my-0 lg:mr-24">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo.png"
              alt="LactoKeeper Logo"
              width={52}
              height={52}
              className="text-primary mr-2 dark:opacity-80"
            />
            <span className="font-['LT_Saeada'] text-2xl text-foreground flex flex-col items-center leading-none">
              LACTO
              <span className="text-primary">KEEPER</span>
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Iniciar sesión
              </h1>
            </div>
            
            <UserAuthForm />
                
            <p className="text-sm text-muted-foreground text-center px-3 py-3 bg-primary/10 rounded">
              En caso de no disponer de una cuenta, contacta con el administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}