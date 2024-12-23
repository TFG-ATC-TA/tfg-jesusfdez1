'use client'

import React, { useState, useEffect, useRef } from 'react'

interface VideoBackgroundProps {
  videos: string[]
}

export default function VideoBackground({ videos }: VideoBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const currentVideoRef = useRef<HTMLVideoElement>(null)
  const nextVideoRef = useRef<HTMLVideoElement>(null)

  const bufferTime = 2 // Start transition 0.5 seconds before video ends

  useEffect(() => {
    const currentVideo = currentVideoRef.current
    const nextVideo = nextVideoRef.current

    if (!currentVideo || !nextVideo) return

    const handleTimeUpdate = () => {
      if (currentVideo.duration - currentVideo.currentTime <= bufferTime && !isTransitioning) {
        setIsTransitioning(true)
        nextVideo.play()
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
  }, [currentIndex, nextIndex, videos.length, isTransitioning])

  useEffect(() => {
    if (nextVideoRef.current) {
      nextVideoRef.current.load()
    }
  }, [nextIndex])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video
        ref={currentVideoRef}
        key={`video-${currentIndex}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out"
        style={{ opacity: isTransitioning ? 0 : 1 }}
        autoPlay
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