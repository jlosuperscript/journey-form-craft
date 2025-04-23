
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Enhanced Dialog component with better lifecycle management
const Dialog = ({ open, onOpenChange, ...props }: DialogPrimitive.DialogProps) => {
  // Internal state for tracking actual open state with delay for transitions
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Sync internal state with external open prop
  React.useEffect(() => {
    if (open) {
      // Add small delay before opening to ensure any previous UI elements are fully closed
      const timer = setTimeout(() => {
        setInternalOpen(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // Add small delay before actually closing
      const timer = setTimeout(() => {
        setInternalOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle actual open state changes with proper timing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // When closing, add delay before notifying parent
      setTimeout(() => {
        if (onOpenChange) onOpenChange(false);
      }, 250);
    } else {
      // When opening, notify parent immediately
      if (onOpenChange) onOpenChange(true);
    }
  };

  return (
    <DialogPrimitive.Root 
      open={internalOpen} 
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
};

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Create a ref to track mounted state
  const isMountedRef = React.useRef(false)
  
  React.useEffect(() => {
    // Add delay to ensure proper mounting
    const timer = setTimeout(() => {
      isMountedRef.current = true
    }, 50);
    
    // Set to false when unmounted with delay
    return () => {
      clearTimeout(timer);
      // Add delay to ensure proper unmounting sequence
      setTimeout(() => {
        isMountedRef.current = false
      }, 100);
    }
  }, [])
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        onEscapeKeyDown={(event) => {
          if (!isMountedRef.current) event.preventDefault()
        }}
        onPointerDownOutside={(event) => {
          if (!isMountedRef.current) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (!isMountedRef.current) event.preventDefault()
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
