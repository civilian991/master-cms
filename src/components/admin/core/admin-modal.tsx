"use client"

import * as React from "react"
import { ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoaderIcon, XIcon } from "lucide-react"

export interface AdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  trigger?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  className?: string
}

export interface AdminModalFormProps extends Omit<AdminModalProps, 'children' | 'footer'> {
  children: ReactNode
  loading?: boolean
  onSubmit?: () => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
  submitVariant?: 'default' | 'destructive'
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg", 
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] max-h-[95vh]"
}

export function AdminModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  footer,
  size = 'md',
  showCloseButton = true,
  className,
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={`${sizeClasses[size]} ${className || ''}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AdminModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  loading = false,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitDisabled = false,
  submitVariant = 'default',
  size = 'md',
  showCloseButton = true,
  className,
}: AdminModalFormProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleSubmit = () => {
    onSubmit?.()
  }

  const footer = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={handleCancel}
        disabled={loading}
      >
        {cancelLabel}
      </Button>
      <Button 
        variant={submitVariant}
        onClick={handleSubmit}
        disabled={loading || submitDisabled}
      >
        {loading ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  )

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      trigger={trigger}
      footer={footer}
      size={size}
      showCloseButton={showCloseButton}
      className={className}
    >
      {children}
    </AdminModal>
  )
} 