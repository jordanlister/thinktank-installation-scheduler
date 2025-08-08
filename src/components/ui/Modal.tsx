/**
 * Modal Components
 * Accessible modal dialogs with overlay and proper focus management
 * Based on Think Tank Technologies Landing Page Design System
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn, trapFocus, restoreFocus, createPortalContainer, generateId } from '../../lib/utils';
import { IconButton } from './Button';
import type { ModalProps, BaseComponentProps } from '../../lib/types';

/**
 * Modal component with accessibility features and glassmorphism styling
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <Modal.Header>
 *     <h2>Are you sure?</h2>
 *   </Modal.Header>
 *   <Modal.Body>
 *     <p>This action cannot be undone.</p>
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={() => setIsOpen(false)}>
 *       Cancel
 *     </Button>
 *     <Button variant="primary">
 *       Confirm
 *     </Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      open,
      onClose,
      title,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      overlayProps = {},
      initialFocus,
      returnFocus,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const modalId = generateId('modal');
    const titleId = generateId('modal-title');

    // Save and restore focus
    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
      } else if (previousActiveElement.current) {
        if (returnFocus) {
          const returnElement = document.querySelector(returnFocus) as HTMLElement;
          restoreFocus(returnElement || previousActiveElement.current);
        } else {
          restoreFocus(previousActiveElement.current);
        }
      }
    }, [open, returnFocus]);

    // Trap focus and handle keyboard events
    useEffect(() => {
      if (!open || !modalRef.current) return;

      let cleanup: (() => void) | undefined;

      // Focus management
      const focusElement = initialFocus
        ? modalRef.current.querySelector(initialFocus) as HTMLElement
        : modalRef.current.querySelector('[data-autofocus]') as HTMLElement || modalRef.current;

      if (focusElement) {
        setTimeout(() => focusElement.focus(), 0);
      }

      // Trap focus
      cleanup = trapFocus(modalRef.current);

      // Handle escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        cleanup?.();
      };
    }, [open, closeOnEscape, onClose, initialFocus]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [open]);

    const handleOverlayClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw] max-h-[95vh]',
    };

    if (!open) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-testid={testId}
        {...props}
      >
        {/* Overlay */}
        <div
          className={cn('ttt-modal-overlay fixed inset-0', overlayProps.className)}
          onClick={handleOverlayClick}
          aria-hidden="true"
          {...overlayProps}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'ttt-modal-content relative w-full',
            sizeClasses[size],
            'max-h-[90vh] overflow-y-auto',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          id={modalId}
        >
          {/* Close button */}
          {showCloseButton && (
            <IconButton
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              className="absolute top-4 right-4 z-10"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
            />
          )}

          {/* Title */}
          {title && (
            <div className="px-6 pt-6 pb-2">
              <h2 id={titleId} className="text-xl font-semibold text-text-primary">
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className={cn('px-6', { 'pt-6': !title, 'pb-6': !title })}>
            {children}
          </div>
        </div>
      </div>
    );

    // Render modal in portal
    const portalContainer = createPortalContainer('modal-portal');
    return createPortal(modalContent, portalContainer);
  }
);

Modal.displayName = 'Modal';

/**
 * Modal Header component
 */
export interface ModalHeaderProps extends BaseComponentProps {
  children: React.ReactNode;
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, 'data-testid': testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pb-4 border-b border-border', className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

/**
 * Modal Body component
 */
export interface ModalBodyProps extends BaseComponentProps {
  children: React.ReactNode;
}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, 'data-testid': testId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-4', className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalBody.displayName = 'ModalBody';

/**
 * Modal Footer component
 */
export interface ModalFooterProps extends BaseComponentProps {
  children: React.ReactNode;
  justify?: 'start' | 'end' | 'center' | 'between';
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  (
    {
      className,
      children,
      justify = 'end',
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'pt-4 border-t border-border flex items-center gap-3',
          justifyClasses[justify],
          className
        )}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

/**
 * Drawer component - side modal variant
 */
export interface DrawerProps extends Omit<ModalProps, 'size'> {
  /** Drawer position */
  position?: 'left' | 'right' | 'top' | 'bottom';
  /** Drawer width (for left/right) or height (for top/bottom) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      className,
      position = 'right',
      size = 'md',
      open,
      onClose,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Trap focus
    useEffect(() => {
      if (!open || !drawerRef.current) return;
      
      const cleanup = trapFocus(drawerRef.current);
      drawerRef.current.focus();
      
      return cleanup;
    }, [open]);

    const handleOverlayClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    // Size classes for different positions
    const sizeClasses = {
      left: {
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-[32rem]',
        xl: 'w-[40rem]',
        full: 'w-full',
      },
      right: {
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-[32rem]',
        xl: 'w-[40rem]',
        full: 'w-full',
      },
      top: {
        sm: 'h-64',
        md: 'h-80',
        lg: 'h-96',
        xl: 'h-[32rem]',
        full: 'h-full',
      },
      bottom: {
        sm: 'h-64',
        md: 'h-80',
        lg: 'h-96',
        xl: 'h-[32rem]',
        full: 'h-full',
      },
    };

    // Position classes
    const positionClasses = {
      left: 'left-0 top-0 h-full',
      right: 'right-0 top-0 h-full',
      top: 'top-0 left-0 w-full',
      bottom: 'bottom-0 left-0 w-full',
    };

    // Animation classes
    const animationClasses = {
      left: 'animate-slide-in-left',
      right: 'animate-slide-in-right',
      top: 'animate-slide-in-top',
      bottom: 'animate-slide-in-bottom',
    };

    if (!open) return null;

    const drawerContent = (
      <div className="fixed inset-0 z-50" data-testid={testId}>
        {/* Overlay */}
        <div
          className="ttt-modal-overlay fixed inset-0"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={drawerRef}
          className={cn(
            'ttt-modal-content fixed',
            positionClasses[position],
            sizeClasses[position][size],
            animationClasses[position],
            'overflow-y-auto',
            className
          )}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...props}
        >
          {children}
        </div>
      </div>
    );

    const portalContainer = createPortalContainer('drawer-portal');
    return createPortal(drawerContent, portalContainer);
  }
);

Drawer.displayName = 'Drawer';

/**
 * Popover component for contextual content
 */
export interface PopoverProps extends BaseComponentProps {
  /** Popover open state */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Trigger element */
  trigger: React.ReactElement;
  /** Popover content */
  children: React.ReactNode;
  /** Popover placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Close on outside click */
  closeOnOutsideClick?: boolean;
}

const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      className,
      open,
      onClose,
      trigger,
      children,
      placement = 'bottom',
      closeOnOutsideClick = true,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const triggerRef = useRef<HTMLElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Handle outside clicks
    useEffect(() => {
      if (!open || !closeOnOutsideClick) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          popoverRef.current &&
          !popoverRef.current.contains(target) &&
          triggerRef.current &&
          !triggerRef.current.contains(target)
        ) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, closeOnOutsideClick, onClose]);

    // Handle escape key
    useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    const placementClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    };

    const triggerWithRef = React.cloneElement(trigger, {
      ref: triggerRef,
    });

    return (
      <div className="relative inline-block">
        {triggerWithRef}
        
        {open && (
          <div
            ref={popoverRef}
            className={cn(
              'absolute z-50 min-w-max',
              'ttt-modal-content rounded-lg shadow-lg',
              'animate-scale-in',
              placementClasses[placement],
              className
            )}
            data-testid={testId}
            {...props}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

Popover.displayName = 'Popover';

/**
 * Tooltip component for helpful hints
 */
export interface TooltipProps extends BaseComponentProps {
  /** Tooltip content */
  content: string;
  /** Trigger element */
  children: React.ReactElement;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Show delay in ms */
  delay?: number;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      className,
      content,
      children,
      placement = 'top',
      delay = 500,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = () => {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const placementClasses = {
      top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
      bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
      left: 'right-full mr-2 top-1/2 -translate-y-1/2',
      right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };

    const arrowClasses = {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-glass',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-glass',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-glass',
      right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-glass',
    };

    const childWithEvents = React.cloneElement(children, {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    });

    return (
      <div ref={ref} className="relative inline-block" data-testid={testId} {...props}>
        {childWithEvents}
        
        {isVisible && (
          <div
            className={cn(
              'absolute z-50 px-2 py-1 text-xs text-white',
              'bg-surface-glass backdrop-blur-sm rounded border border-border',
              'animate-fade-in pointer-events-none whitespace-nowrap',
              placementClasses[placement],
              className
            )}
            role="tooltip"
            aria-hidden="true"
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-0 h-0 border-4 border-transparent',
                arrowClasses[placement]
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

// Compose Modal with sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal as default, Drawer, Popover, Tooltip };