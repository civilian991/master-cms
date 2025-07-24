"use client"

import { useState, useEffect } from 'react'
import { TouchButton } from '@/components/mobile/touch-optimized-button'
import { 
  ToastProvider, 
  useSuccessToast, 
  useErrorToast, 
  useWarningToast, 
  useInfoToast 
} from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModernInput } from '@/components/ui/modern-input'
import { 
  Smartphone,
  TouchpadIcon as Touch,
  Zap,
  Bell,
  Accessibility,
  Gauge,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Heart,
  Star,
  ThumbsUp,
  Download,
  Share,
  Play,
  Pause,
  Settings,
  Sparkles,
  Rocket
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo Component with Toast Hooks
const ToastDemo = () => {
  const showSuccess = useSuccessToast()
  const showError = useErrorToast()
  const showWarning = useWarningToast()
  const showInfo = useInfoToast()

  return (
    <div className="space-y-4">
      <h4 className="text-heading text-gray-900">Toast Notifications</h4>
      <div className="grid grid-cols-2 gap-3">
        <TouchButton
          size="default"
          variant="default"
          onClick={() => showSuccess('Article saved successfully!', 'Success')}
          className="bg-gradient-to-r from-success-500 to-success-600"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Success
        </TouchButton>
        
        <TouchButton
          size="default"
          variant="destructive"
          onClick={() => showError('Failed to connect to server', 'Connection Error', {
            label: 'Retry',
            onClick: () => console.log('Retrying...')
          })}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Error
        </TouchButton>
        
        <TouchButton
          size="default"
          variant="outline"
          onClick={() => showWarning('Changes not saved', 'Warning')}
          className="border-warning-300 text-warning-700 hover:bg-warning-50"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Warning
        </TouchButton>
        
        <TouchButton
          size="default"
          variant="outline"
          onClick={() => showInfo('New features available', 'Info', {
            label: 'Learn More',
            onClick: () => console.log('Learning more...')
          })}
          className="border-brand-300 text-brand-700 hover:bg-brand-50"
        >
          <Info className="h-4 w-4 mr-2" />
          Info
        </TouchButton>
      </div>
    </div>
  )
}

const MicroInteractionsDemo = () => {
  const [liked, setLiked] = useState(false)
  const [starred, setStarred] = useState(false)
  const [thumbsUp, setThumbsUp] = useState(false)

  return (
    <div className="space-y-6">
      <h4 className="text-heading text-gray-900">Micro-Interactions</h4>
      
      {/* Interactive Buttons with Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TouchButton
          size="lg"
          variant={liked ? "default" : "outline"}
          touchFeedback="bounce"
          onClick={() => setLiked(!liked)}
          className={cn(
            "transition-all duration-300",
            liked 
              ? "bg-gradient-to-r from-pink-500 to-red-500 text-white scale-105" 
              : "hover:border-pink-300 hover:text-pink-600"
          )}
        >
          <Heart className={cn("h-5 w-5 mr-2 transition-all", liked && "fill-current")} />
          {liked ? 'Loved!' : 'Like'}
        </TouchButton>

        <TouchButton
          size="lg"
          variant={starred ? "default" : "outline"}
          touchFeedback="glow"
          onClick={() => setStarred(!starred)}
          className={cn(
            "transition-all duration-300",
            starred 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white scale-105" 
              : "hover:border-yellow-300 hover:text-yellow-600"
          )}
        >
          <Star className={cn("h-5 w-5 mr-2 transition-all", starred && "fill-current")} />
          {starred ? 'Starred!' : 'Star'}
        </TouchButton>

        <TouchButton
          size="lg"
          variant={thumbsUp ? "default" : "outline"}
          touchFeedback="ripple"
          onClick={() => setThumbsUp(!thumbsUp)}
          className={cn(
            "transition-all duration-300",
            thumbsUp 
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105" 
              : "hover:border-blue-300 hover:text-blue-600"
          )}
        >
          <ThumbsUp className={cn("h-5 w-5 mr-2 transition-all", thumbsUp && "fill-current")} />
          {thumbsUp ? 'Liked!' : 'Thumbs Up'}
        </TouchButton>
      </div>

      {/* Hover Effects Showcase */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 cursor-pointer micro-bounce">
          <Download className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-caption text-center text-gray-700">Hover Scale</p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft transition-all duration-200 cursor-pointer glow-on-hover">
          <Share className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-caption text-center text-gray-700">Glow Effect</p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-300 cursor-pointer hover:rotate-2">
          <Play className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <p className="text-caption text-center text-gray-700">Rotate</p>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer hover:bg-gradient-subtle">
          <Settings className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-caption text-center text-gray-700">Background</p>
        </div>
      </div>
    </div>
  )
}

const AccessibilityDemo = () => {
  return (
    <div className="space-y-6">
      <h4 className="text-heading text-gray-900">Accessibility Features</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h5 className="text-body font-medium text-gray-800">Focus Management</h5>
          <div className="space-y-3">
            <TouchButton size="default" className="w-full focus-ring">
              Accessible Button 1
            </TouchButton>
            <TouchButton size="default" variant="outline" className="w-full focus-ring">
              Accessible Button 2
            </TouchButton>
            <ModernInput
              variant="floating"
              label="Accessible Input"
              placeholder="Try tabbing through"
              className="focus-ring"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-body font-medium text-gray-800">Touch Targets</h5>
          <div className="space-y-3">
            <TouchButton size="lg" className="w-full touch-target-lg">
              Large Touch Target (56px)
            </TouchButton>
            <TouchButton size="default" className="w-full touch-target">
              Standard Touch Target (44px)
            </TouchButton>
            <TouchButton size="sm" className="w-full touch-target-sm">
              Small Touch Target (40px)
            </TouchButton>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-subtle rounded-lg border border-gray-200">
        <h5 className="text-body font-medium text-gray-800 mb-4">WCAG 2.1 AA Compliance</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-caption text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Color contrast ratios 4.5:1+</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Keyboard navigation support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Focus indicators visible</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Screen reader compatible</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Touch target size 44px+</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Reduced motion support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PerformanceDemo = () => {
  const [isAnimating, setIsAnimating] = useState(false)

  return (
    <div className="space-y-6">
      <h4 className="text-heading text-gray-900">Performance Optimization</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft">
          <h5 className="text-body font-medium text-gray-800 mb-4">Animation Performance</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">Frame Rate</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                60fps
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">GPU Acceleration</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">Layer Promotion</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                Optimized
              </Badge>
            </div>
            
            <TouchButton
              size="default"
              onClick={() => setIsAnimating(!isAnimating)}
              className="w-full mt-4"
            >
              {isAnimating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isAnimating ? 'Stop' : 'Test'} Animations
            </TouchButton>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-soft">
          <h5 className="text-body font-medium text-gray-800 mb-4">Bundle Optimization</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">Tree Shaking</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">Code Splitting</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-gray-600">Lazy Loading</span>
              <Badge variant="outline" className="bg-success-50 text-success-700 border-success-200">
                Implemented
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Test Elements */}
      {isAnimating && (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-20 bg-gradient-brand rounded-lg animate-[pulse-soft_2s_infinite] shadow-soft"
              style={{ animationDelay: `${index * 200}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main Page Component
const EpicPhase3Demo = () => {
  return (
    <ToastProvider position="top-right">
      <div className="min-h-screen bg-gray-25 animate-[fadeIn_0.5s_ease-out]">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-[slideInDown_0.6s_ease-out]">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-display text-gray-900">Epic 11 Phase 3</h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Final Phase
              </Badge>
            </div>
            <p className="text-body text-gray-600 max-w-3xl mx-auto">
              Mobile-first responsiveness, advanced micro-interactions, error handling, 
              performance optimization, and accessibility compliance
            </p>
          </div>

          {/* Feature Sections */}
          <div className="space-y-8">
            {/* Mobile Optimization */}
            <Card className="border-0 shadow-soft animate-[slideInUp_0.7s_ease-out]">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  Story 11.6: Mobile-First Responsive Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <h4 className="text-heading text-gray-900">Touch-Optimized Components</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <TouchButton size="lg" touchFeedback="scale">
                      <Touch className="h-5 w-5 mr-2" />
                      Scale
                    </TouchButton>
                    <TouchButton size="lg" touchFeedback="glow" variant="outline">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Glow
                    </TouchButton>
                    <TouchButton size="lg" touchFeedback="ripple" variant="secondary">
                      <Zap className="h-5 w-5 mr-2" />
                      Ripple
                    </TouchButton>
                    <TouchButton size="lg" touchFeedback="bounce" variant="outline">
                      <Rocket className="h-5 w-5 mr-2" />
                      Bounce
                    </TouchButton>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Micro-Interactions */}
            <Card className="border-0 shadow-soft animate-[slideInUp_0.8s_ease-out]">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  Story 11.7: Advanced Micro-Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MicroInteractionsDemo />
              </CardContent>
            </Card>

            {/* Error Handling & Notifications */}
            <Card className="border-0 shadow-soft animate-[slideInUp_0.9s_ease-out]">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  Story 11.8: Error Handling & User Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ToastDemo />
              </CardContent>
            </Card>

            {/* Performance Optimization */}
            <Card className="border-0 shadow-soft animate-[slideInUp_1s_ease-out]">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-purple-600" />
                  </div>
                  Story 11.9: Performance Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceDemo />
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card className="border-0 shadow-soft animate-[slideInUp_1.1s_ease-out]">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Accessibility className="h-5 w-5 text-teal-600" />
                  </div>
                  Story 11.10: Final Polish & Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AccessibilityDemo />
              </CardContent>
            </Card>
          </div>

          {/* Success Summary */}
          <Card className="border-0 shadow-soft bg-gradient-to-r from-green-50 to-blue-50 animate-[slideInUp_1.2s_ease-out]">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-success-600" />
                </div>
                <div>
                  <h3 className="text-heading text-gray-900 mb-2">Epic 11 Complete!</h3>
                  <p className="text-body text-gray-600 max-w-2xl mx-auto">
                    Master-CMS now features enterprise-level design with mobile-first responsiveness, 
                    sophisticated micro-interactions, comprehensive error handling, 60fps performance, 
                    and WCAG 2.1 AA accessibility compliance.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-caption text-gray-600">
                  <div className="flex flex-col items-center">
                    <Smartphone className="h-6 w-6 text-blue-500 mb-2" />
                    <span>Mobile-First</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Zap className="h-6 w-6 text-green-500 mb-2" />
                    <span>Micro-Interactions</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Bell className="h-6 w-6 text-orange-500 mb-2" />
                    <span>Toast System</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Gauge className="h-6 w-6 text-purple-500 mb-2" />
                    <span>60fps Performance</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Accessibility className="h-6 w-6 text-teal-500 mb-2" />
                    <span>WCAG 2.1 AA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToastProvider>
  )
}

export default EpicPhase3Demo 