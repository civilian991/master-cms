import { useState, useEffect } from 'react'

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

interface PushNotificationActions {
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  requestPermission: () => Promise<NotificationPermission>
}

export function usePushNotifications(): PushNotificationState & PushNotificationActions {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null
  })

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setState(prev => ({ ...prev, isSupported }))

    if (isSupported) {
      checkSubscriptionStatus()
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setState(prev => ({ ...prev, isSubscribed: !!subscription }))
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  const subscribe = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const permission = await requestPermission()
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        // This would typically use your VAPID public key
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })

        // Send subscription to your server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        })

        setState(prev => ({ ...prev, isSubscribed: true, isLoading: false }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Subscription failed',
        isLoading: false 
      }))
    }
  }

  const unsubscribe = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          await subscription.unsubscribe()
          
          // Notify your server
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          })
        }

        setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unsubscription failed',
        isLoading: false 
      }))
    }
  }

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission
  }
} 