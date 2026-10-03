import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/utils'
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize } from 'react-icons/fi'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export default function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video) setCurrentTime(video.currentTime)
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video) {
      setDuration(video.duration)
      setIsLoaded(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Number(e.target.value)
      setCurrentTime(Number(e.target.value))
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    const vol = Number(e.target.value)
    if (video) {
      video.volume = vol
      setVolume(vol)
      setIsMuted(vol === 0)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    if (isMuted) {
      video.volume = volume || 1
      video.muted = false
      setIsMuted(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      await container.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      aria-label="Video player"
      className={cn('relative group bg-black rounded-xl overflow-hidden select-none', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {!isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black hover:bg-white transition-all shadow-lg"
          >
            <FiPlay size={28} className="ml-1" />
          </button>
        </div>
      )}

      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300',
        showControls ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="relative mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-primary-500"
          />
          <div className="absolute top-0 left-0 h-1 bg-primary-500 rounded-full pointer-events-none" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
              {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-primary-400 transition-colors">
                {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-white"
              />
            </div>
            <span className="text-xs text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition-colors">
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
