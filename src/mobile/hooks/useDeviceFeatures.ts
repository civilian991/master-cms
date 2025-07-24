import { useState, useEffect } from 'react'

interface DeviceFeatures {
  // Hardware capabilities
  hasCamera: boolean
  hasMicrophone: boolean
  hasGeolocation: boolean
  hasVibration: boolean
  hasBattery: boolean
  hasAccelerometer: boolean
  hasGyroscope: boolean
  
  // Network information
  isOnline: boolean
  connectionType: string | null
  
  // Device information
  userAgent: string
  platform: string
  screenSize: { width: number; height: number }
  viewportSize: { width: number; height: number }
  pixelRatio: number
  
  // PWA capabilities
  isStandalone: boolean
  canInstall: boolean
  
  // Performance information
  deviceMemory: number | null
  hardwareConcurrency: number
}

export function useDeviceFeatures(): DeviceFeatures {
  const [features, setFeatures] = useState<DeviceFeatures>({
    hasCamera: false,
    hasMicrophone: false,
    hasGeolocation: false,
    hasVibration: false,
    hasBattery: false,
    hasAccelerometer: false,
    hasGyroscope: false,
    isOnline: navigator.onLine,
    connectionType: null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenSize: { width: screen.width, height: screen.height },
    viewportSize: { width: window.innerWidth, height: window.innerHeight },
    pixelRatio: window.devicePixelRatio,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    canInstall: false,
    deviceMemory: null,
    hardwareConcurrency: navigator.hardwareConcurrency
  })

  useEffect(() => {
    const checkFeatures = async () => {
      const newFeatures: Partial<DeviceFeatures> = {}

      // Check camera access
      try {
        if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
          newFeatures.hasCamera = true
          newFeatures.hasMicrophone = true
        }
      } catch (error) {
        console.log('Media devices not available')
      }

      // Check geolocation
      newFeatures.hasGeolocation = 'geolocation' in navigator

      // Check vibration
      newFeatures.hasVibration = 'vibrate' in navigator

      // Check battery API
      newFeatures.hasBattery = 'getBattery' in navigator

      // Check device motion/orientation
      newFeatures.hasAccelerometer = 'DeviceMotionEvent' in window
      newFeatures.hasGyroscope = 'DeviceOrientationEvent' in window

      // Check connection type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        newFeatures.connectionType = connection.effectiveType || null
      }

      // Check device memory
      if ('deviceMemory' in navigator) {
        newFeatures.deviceMemory = (navigator as any).deviceMemory
      }

      setFeatures(prev => ({ ...prev, ...newFeatures }))
    }

    checkFeatures()

    // Listen for online/offline events
    const handleOnline = () => setFeatures(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setFeatures(prev => ({ ...prev, isOnline: false }))

    // Listen for viewport changes
    const handleResize = () => {
      setFeatures(prev => ({
        ...prev,
        viewportSize: { width: window.innerWidth, height: window.innerHeight }
      }))
    }

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = () => {
      setFeatures(prev => ({ ...prev, canInstall: true }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('resize', handleResize)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return features
} 