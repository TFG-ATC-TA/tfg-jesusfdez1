'use client'

import React, { useState, useEffect, useRef } from 'react'

interface VideoBackgroundProps {
  videos: string[]
}

export default function VideoBackground({ videos }: VideoBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const currentVideoRef = useRef<HTMLVideoElement>(null)
  const nextVideoRef = useRef<HTMLVideoElement>(null)

  const bufferTime = 2 // Start transition 2 seconds before video ends

  // Handle initial client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return;
    
    const currentVideo = currentVideoRef.current
    const nextVideo = nextVideoRef.current

    if (!currentVideo || !nextVideo) return

    // Auto-play the first video after mounting
    const playVideo = async () => {
      try {
        await currentVideo.play();
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
    
    playVideo();

    const handleTimeUpdate = () => {
      if (currentVideo.duration - currentVideo.currentTime <= bufferTime && !isTransitioning) {
        setIsTransitioning(true)
        nextVideo.play().catch(err => console.error('Error playing next video:', err))
      }
    }

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

  // Don't render anything during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
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