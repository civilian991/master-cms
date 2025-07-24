"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Save, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"

export interface FormStep {
  id: string
  title: string
  description?: string
  component: React.ComponentType<any>
  validation?: () => boolean | Promise<boolean>
  optional?: boolean
}

export interface ModernFormProps {
  title?: string
  description?: string
  steps?: FormStep[]
  currentStep?: number
  onStepChange?: (step: number) => void
  onSubmit?: (data: any) => void | Promise<void>
  autoSave?: boolean
  autoSaveInterval?: number
  onAutoSave?: (data: any) => void
  className?: string
  children?: React.ReactNode
  loading?: boolean
  error?: string
  success?: string
}

// Multi-Step Form Component
export const ModernMultiStepForm: React.FC<ModernFormProps> = ({
  title,
  description,
  steps = [],
  currentStep = 0,
  onStepChange,
  onSubmit,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  className,
  loading = false,
  error,
  success
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onAutoSave) return

    const interval = setInterval(async () => {
      setSaving(true)
      try {
        await onAutoSave(formData)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setSaving(false)
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [formData, autoSave, autoSaveInterval, onAutoSave])

  const totalSteps = steps.length
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const currentStepData = steps[currentStep]

  const handleNext = async () => {
    if (currentStepData?.validation) {
      const isValid = await currentStepData.validation()
      if (!isValid) return
    }
    
    if (currentStep < totalSteps - 1) {
      onStepChange?.(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange?.(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData)
    }
  }

  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center space-y-2">
          {title && (
            <h1 className="text-display text-gray-900">{title}</h1>
          )}
          {description && (
            <p className="text-body text-gray-600 max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {totalSteps > 1 && (
        <Card className="border-0 shadow-soft bg-gradient-subtle">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Step Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-caption font-medium text-gray-700">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span className="text-caption text-gray-500">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-200"
                />
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                        index < currentStep 
                          ? "bg-success-600 text-white" 
                          : index === currentStep
                          ? "bg-brand-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div 
                        className={cn(
                          "h-px w-12 mx-2 transition-colors duration-200",
                          index < currentStep ? "bg-success-600" : "bg-gray-200"
                        )} 
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Current Step Info */}
              {currentStepData && (
                <div className="text-center space-y-1">
                  <h3 className="text-heading text-gray-900">
                    {currentStepData.title}
                  </h3>
                  {currentStepData.description && (
                    <p className="text-body text-gray-600">
                      {currentStepData.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-save Status */}
      {autoSave && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            {saving ? (
              <>
                <Save className="h-4 w-4 text-brand-600 animate-pulse" />
                <span className="text-caption text-gray-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span className="text-caption text-gray-600">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-caption text-gray-600">Auto-save enabled</span>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-caption">
            Auto-save
          </Badge>
        </div>
      )}

      {/* Form Content */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-error-600" />
              <div>
                <p className="text-caption font-medium text-error-900">Error</p>
                <p className="text-caption text-error-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <div>
                <p className="text-caption font-medium text-success-900">Success</p>
                <p className="text-caption text-success-700">{success}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          {currentStepData?.component && (
            <currentStepData.component 
              data={formData} 
              onChange={setFormData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Actions */}
      {totalSteps > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || loading}
            className="shadow-soft hover:shadow-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {!isLastStep ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-gradient-brand shadow-soft hover:shadow-medium"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-brand shadow-soft hover:shadow-medium"
              >
                {loading ? "Submitting..." : "Complete"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Single Form Layout Component
export const ModernFormLayout: React.FC<{
  title?: string
  description?: string
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  loading?: boolean
  error?: string
  success?: string
  actions?: React.ReactNode
  className?: string
}> = ({
  title,
  description,
  children,
  onSubmit,
  loading = false,
  error,
  success,
  actions,
  className
}) => {
  return (
    <div className={cn("max-w-2xl mx-auto space-y-6", className)}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center space-y-2">
          {title && (
            <h1 className="text-display text-gray-900">{title}</h1>
          )}
          {description && (
            <p className="text-body text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Form Container */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-error-600" />
                <div>
                  <p className="text-caption font-medium text-error-900">Error</p>
                  <p className="text-caption text-error-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <div>
                  <p className="text-caption font-medium text-success-900">Success</p>
                  <p className="text-caption text-success-700">{success}</p>
                </div>
              </div>
            )}

            {/* Form Content */}
            {children}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              {actions ? (
                actions
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-brand shadow-soft hover:shadow-medium"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Field Group Component for better organization
export const ModernFieldGroup: React.FC<{
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}> = ({ title, description, children, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-heading text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-body text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Two-column layout for forms
export const ModernFormGrid: React.FC<{
  children: React.ReactNode
  columns?: 1 | 2
  className?: string
}> = ({ children, columns = 2, className }) => {
  return (
    <div 
      className={cn(
        "grid gap-6",
        columns === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  )
} 