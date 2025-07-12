/**
 * Componente de fondo de video con reproducción automática y transiciones
 * Maneja la reproducción continua de videos con transiciones suaves
 * Optimizado para fondos de pantalla completa con múltiples videos
 */

'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Props del componente VideoBackground
 */
interface VideoBackgroundProps {
  videos: string[];
}

/**
 * Componente de fondo de video con reproducción automática
 * Reproduce videos en bucle con transiciones suaves entre ellos
 * @param videos - Array de URLs de videos a reproducir
 */
export default function VideoBackground({ videos }: VideoBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const currentVideoRef = useRef<HTMLVideoElement>(null)
  const nextVideoRef = useRef<HTMLVideoElement>(null)

  const bufferTime = 2 // Iniciar transición 2 segundos antes de que termine el video

  // Manejar el montaje inicial del lado del cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return;
    
    const currentVideo = currentVideoRef.current
    const nextVideo = nextVideoRef.current

    if (!currentVideo || !nextVideo) return

    // Reproducir automáticamente el primer video después del montaje
    const playVideo = async () => {
      try {
        await currentVideo.play();
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
    
    playVideo();

    /**
     * Maneja la actualización del tiempo del video
     * Inicia la transición cuando se acerca al final
     */
    const handleTimeUpdate = () => {
      if (currentVideo.duration - currentVideo.currentTime <= bufferTime && !isTransitioning) {
        setIsTransitioning(true)
        nextVideo.play().catch(err => console.error('Error playing next video:', err))
      }
    }

    /**
     * Maneja el final de la transición
     * Actualiza los índices y reinicia el estado
     */
    const handleTransitionEnd = () => {
      setCurrentIndex(nextIndex)
      setNextIndex((nextIndex + 1) % videos.length)
      setIsTransitioning(false)
    }

    currentVideo.addEventListener('timeupdate', handleTimeUpdate)
    nextVideo.addEventListener('transitionend', handleTransitionEnd)

    return () => {
      currentVideo.removeEventListener('timeupdate', handleTimeUpdate)
      nextVideo.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [currentIndex, nextIndex, videos.length, isTransitioning, isMounted])

  useEffect(() => {
    if (!isMounted) return;
    
    if (nextVideoRef.current) {
      nextVideoRef.current.load()
    }
  }, [nextIndex, isMounted])

  // No renderizar nada durante SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Video actual */}
      <video
        ref={currentVideoRef}
        key={`video-${currentIndex}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out"
        style={{ opacity: isTransitioning ? 0 : 1 }}
        muted
        playsInline
      >
        <source src={videos[currentIndex]} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video siguiente (precargado) */}
      <video
        ref={nextVideoRef}
        key={`video-${nextIndex}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out"
        style={{ opacity: isTransitioning ? 1 : 0 }}
        muted
        playsInline
      >
        <source src={videos[nextIndex]} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}