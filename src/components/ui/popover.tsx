
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

// Enhanced Popover with better transition handling
const Popover = ({ open, onOpenChange, ...props }: PopoverPrimitive.PopoverProps) => {
  // Internal state for tracking actual open state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isClosingRef = React.useRef(false);
  
  // Sync internal state with external open prop
  React.useEffect(() => {
    if (open) {
      // Delay opening to ensure proper timing
      const timer = setTimeout(() => {
        setInternalOpen(true);
        isClosingRef.current = false;
      }, 150);
      return () => clearTimeout(timer);
    } else if (open === false) {
      // Mark as closing
      isClosingRef.current = true;
      // Delay actual closing
      const timer = setTimeout(() => {
        setInternalOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle actual open state changes
  const handleOpenChange = (newOpen: boolean) => {
    // If closing and already closing, do nothing
    if (!newOpen && isClosingRef.current) return;
    
    if (!newOpen) {
      // When closing, mark as closing first
      isClosingRef.current = true;
      // Then notify parent after delay
      setTimeout(() => {
        if (onOpenChange) onOpenChange(false);
      }, 250);
    } else {
      // When opening, notify parent immediately
      if (onOpenChange) onOpenChange(true);
    }
  };

  return (
    <PopoverPrimitive.Root 
      open={internalOpen} 
      onOpenChange={handleOpenChange}
      {...props} 
    />
  );
};

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverClose = PopoverPrimitive.Close

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  // Create a ref to track component lifecycle
  const isMountedRef = React.useRef(false)
  const isClosingRef = React.useRef(false)
  
  React.useEffect(() => {
    // Set flag to true when mounted with a delay to ensure DOM is ready
    const mountTimer = setTimeout(() => {
      isMountedRef.current = true
    }, 50)
    
    // Cleanup function with better timing
    return () => {
      clearTimeout(mountTimer)
      
      // Mark as closing first
      isClosingRef.current = true
      
      // Then actually unmount after animation completes
      setTimeout(() => {
        isMountedRef.current = false
        isClosingRef.current = false
      }, 300) // Animation duration + buffer
    }
  }, [])
  
  // Handler for outside interactions
  const handleOutsideInteraction = (event: Event) => {
    if (!isMountedRef.current || isClosingRef.current) {
      event.preventDefault()
    }
  }

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        onEscapeKeyDown={handleOutsideInteraction}
        onPointerDownOutside={handleOutsideInteraction}
        onInteractOutside={handleOutsideInteraction}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverClose }
