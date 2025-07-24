'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Mobile modal variants
const mobileModalVariants = cva(
  'fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center',
  {
    variants: {
      size: {
        small: 'sm:max-w-sm',
        default: 'sm:max-w-md',
        large: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        full: 'sm:max-w-full sm:max-h-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const mobileModalContentVariants = cva(
  'relative w-full bg-background border border-border shadow-lg transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'rounded-t-2xl sm:rounded-2xl max-h-[90vh] sm:max-h-[80vh]',
        fullscreen: 'rounded-none h-full',
        bottom: 'rounded-t-2xl',
        center: 'rounded-2xl',
      },
      animation: {
        slideUp: 'animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95',
        slideDown: 'animate-in slide-in-from-top-full',
        fade: 'animate-in fade-in-0',
        scale: 'animate-in zoom-in-95',
      },
    },
    defaultVariants: {
      variant: 'default',
      animation: 'slideUp',
    },
  }
);

export interface MobileModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileModalVariants>,
    VariantProps<typeof mobileModalContentVariants> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  swipeToClose?: boolean;
}

const MobileModal = forwardRef<HTMLDivElement, MobileModalProps>(
  ({
    className,
    size,
    variant,
    animation,
    open,
    onClose,
    title,
    description,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    preventScroll = true,
    swipeToClose = true,
    children,
    ...props
  }, ref) => {
    const [mounted, setMounted] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    // Mount component on client side
    useEffect(() => {
      setMounted(true);
    }, []);

    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (!preventScroll) return;

      if (open) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = '0px'; // Prevent layout shift
      } else {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }

      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }, [open, preventScroll]);

    // Handle touch events for swipe to close
    useEffect(() => {
      if (!swipeToClose || !open) return;

      const handleTouchStart = (e: TouchEvent) => {
        if (!contentRef.current?.contains(e.target as Node)) return;
        
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        
        currentY.current = e.touches[0].clientY;
        const deltaY = currentY.current - startY.current;
        
        if (deltaY > 0) {
          // Only allow downward swipe
          if (contentRef.current) {
            contentRef.current.style.transform = `translateY(${deltaY}px)`;
            contentRef.current.style.opacity = `${Math.max(0.5, 1 - deltaY / 300)}`;
          }
        }
      };

      const handleTouchEnd = () => {
        if (!isDragging.current) return;
        
        const deltaY = currentY.current - startY.current;
        
        if (deltaY > 100) {
          // Close modal if swiped down more than 100px
          onClose();
        } else {
          // Reset position
          if (contentRef.current) {
            contentRef.current.style.transform = '';
            contentRef.current.style.opacity = '';
          }
        }
        
        isDragging.current = false;
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [swipeToClose, open, onClose]);

    if (!mounted || !open) return null;

    const modalContent = (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (closeOnOverlayClick && e.target === overlayRef.current) {
            onClose();
          }
        }}
      >
        <div className={cn(mobileModalVariants({ size }))}>
          <div
            ref={contentRef}
            className={cn(mobileModalContentVariants({ variant, animation }), className)}
            {...props}
          >
            {/* Swipe indicator for mobile */}
            {swipeToClose && variant !== 'fullscreen' && (
              <div className="flex justify-center pt-2 pb-1 sm:hidden">
                <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3 className="text-lg font-semibold truncate">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 ml-2 rounded-full hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);
MobileModal.displayName = 'MobileModal';

// Mobile bottom sheet component
export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  showHandle?: boolean;
  children: React.ReactNode;
  className?: string;
}

const MobileBottomSheet = forwardRef<HTMLDivElement, MobileBottomSheetProps>(
  ({
    open,
    onClose,
    title,
    snapPoints = [300, 600],
    initialSnap = 0,
    showHandle = true,
    children,
    className,
  }, ref) => {
    const [mounted, setMounted] = useState(false);
    const [currentHeight, setCurrentHeight] = useState(snapPoints[initialSnap]);
    const contentRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const isDragging = useRef<boolean>(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Handle touch events for dragging
    useEffect(() => {
      if (!open) return;

      const handleTouchStart = (e: TouchEvent) => {
        if (!contentRef.current?.contains(e.target as Node)) return;
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        
        const deltaY = e.touches[0].clientY - startY.current;
        const newHeight = Math.max(0, currentHeight - deltaY);
        
        if (contentRef.current) {
          contentRef.current.style.height = `${newHeight}px`;
        }
      };

      const handleTouchEnd = () => {
        if (!isDragging.current) return;
        
        const currentContentHeight = contentRef.current?.offsetHeight || currentHeight;
        
        // Find closest snap point
        let closestSnap = snapPoints[0];
        let minDistance = Math.abs(currentContentHeight - closestSnap);
        
        snapPoints.forEach(snap => {
          const distance = Math.abs(currentContentHeight - snap);
          if (distance < minDistance) {
            minDistance = distance;
            closestSnap = snap;
          }
        });
        
        // Close if dragged below minimum
        if (closestSnap < snapPoints[0] * 0.5) {
          onClose();
        } else {
          setCurrentHeight(closestSnap);
          if (contentRef.current) {
            contentRef.current.style.height = `${closestSnap}px`;
          }
        }
        
        isDragging.current = false;
      };

      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [open, currentHeight, snapPoints, onClose]);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 right-0">
          <div
            ref={contentRef}
            className={cn(
              'bg-background border-t border-border rounded-t-2xl transition-all duration-300',
              'max-h-[90vh] overflow-hidden',
              className
            )}
            style={{ height: currentHeight }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center py-2">
                <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="px-4 pb-2">
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {children}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }
);
MobileBottomSheet.displayName = 'MobileBottomSheet';

// Mobile action sheet component
export interface MobileActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MobileActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: MobileActionSheetAction[];
  showCancel?: boolean;
  cancelLabel?: string;
}

const MobileActionSheet = forwardRef<HTMLDivElement, MobileActionSheetProps>(
  ({
    open,
    onClose,
    title,
    message,
    actions,
    showCancel = true,
    cancelLabel = 'Cancel',
  }, ref) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="space-y-2">
            {/* Main actions */}
            <div className="bg-background rounded-2xl overflow-hidden border border-border">
              {(title || message) && (
                <div className="p-4 text-center border-b border-border">
                  {title && (
                    <h3 className="text-lg font-semibold">{title}</h3>
                  )}
                  {message && (
                    <p className="text-sm text-muted-foreground mt-1">{message}</p>
                  )}
                </div>
              )}
              
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  disabled={action.disabled}
                  className={cn(
                    'w-full p-4 text-left flex items-center gap-3 min-h-[56px]',
                    'transition-colors touch-manipulation',
                    !action.disabled && 'hover:bg-muted/50 active:bg-muted',
                    action.disabled && 'opacity-50 cursor-not-allowed',
                    action.destructive && 'text-destructive',
                    index < actions.length - 1 && 'border-b border-border'
                  )}
                >
                  {action.icon && (
                    <div className="flex-shrink-0">
                      {action.icon}
                    </div>
                  )}
                  <span className="flex-1 font-medium">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Cancel button */}
            {showCancel && (
              <button
                onClick={onClose}
                className="w-full p-4 bg-background border border-border rounded-2xl font-semibold min-h-[56px] hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }
);
MobileActionSheet.displayName = 'MobileActionSheet';

// Mobile drawer component for navigation
export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
  className?: string;
}

const MobileDrawer = forwardRef<HTMLDivElement, MobileDrawerProps>(
  ({
    open,
    onClose,
    side = 'left',
    width = '280px',
    children,
    className,
  }, ref) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Prevent body scroll when drawer is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div
          ref={ref}
          className={cn(
            'absolute top-0 bottom-0 bg-background border-border shadow-lg',
            'transition-transform duration-300 ease-out',
            side === 'left' ? 'left-0 border-r animate-in slide-in-from-left' : 'right-0 border-l animate-in slide-in-from-right',
            className
          )}
          style={{ width }}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
MobileDrawer.displayName = 'MobileDrawer';

export {
  MobileModal,
  MobileBottomSheet,
  MobileActionSheet,
  MobileDrawer,
  mobileModalVariants,
  mobileModalContentVariants,
}; 