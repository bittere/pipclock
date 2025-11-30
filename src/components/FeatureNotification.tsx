import { useState, useEffect } from 'react'

interface FeatureNotificationProps {
  message: string
  id?: string
  autoDismissMs?: number
}

const STORAGE_KEY = 'feature_notifications_shown'

export default function FeatureNotification({ 
  message, 
  id, 
  autoDismissMs = 10000 
}: FeatureNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  
  useEffect(() => {
    // Use provided id or default to message text for uniqueness
    const notificationId = id || message
    
    // Check if this notification has been shown before
    const shownNotifications = getShownNotifications()
    
    if (!shownNotifications.includes(notificationId)) {
      // Show the notification
      setIsVisible(true)
      
      // Auto-dismiss after specified time
      if (autoDismissMs > 0) {
        const timer = setTimeout(() => {
          handleDismiss()
        }, autoDismissMs)
        
        return () => clearTimeout(timer)
      }
    }
  }, [message, id, autoDismissMs])
  
  const getShownNotifications = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
  const markAsShown = () => {
    const notificationId = id || message
    const shownNotifications = getShownNotifications()
    
    if (!shownNotifications.includes(notificationId)) {
      shownNotifications.push(notificationId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shownNotifications))
    }
  }
  
  const handleDismiss = () => {
    setIsAnimatingOut(true)
    markAsShown()
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }
  
  if (!isVisible) return null
  
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isAnimatingOut 
          ? 'opacity-0 -translate-y-4' 
          : 'opacity-100 translate-y-0'
      }`}
      style={{
        animation: isAnimatingOut ? 'none' : 'slideDown 0.3s ease-out',
      }}
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-2xl">
        <div className="flex-shrink-0 text-2xl">✨</div>
        <div className="flex-1 font-medium text-sm">{message}</div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 hover:bg-white/20 rounded-full p-1.5 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -1rem);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  )
}
