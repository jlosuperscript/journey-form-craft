
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenuRoot = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

// Improved DropdownMenu component with better transition management
const DropdownMenu = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> & {
    children: React.ReactNode | ((props: {
      open: boolean;
      setOpen: React.Dispatch<React.SetStateAction<boolean>>;
      preventClose: () => void;
    }) => React.ReactNode)
  }
>(({ children, open: externalOpen, onOpenChange: externalOnOpenChange, ...props }, _ref) => {
  // Internal state management
  const [open, setOpen] = React.useState(false)
  const preventCloseRef = React.useRef(false)
  const closeInProgressRef = React.useRef(false)
  
  // Flag to prevent interaction during transitions
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  
  // Sync with external open state if provided
  React.useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen)
    }
  }, [externalOpen])
  
  // Track when menu has fully closed to prevent interaction issues
  React.useEffect(() => {
    if (!open) {
      // Mark as transitioning
      setIsTransitioning(true)
      
      // Add a delay to match animation duration
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        closeInProgressRef.current = false
      }, 300) // Animation duration + buffer
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle open state changes
  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    // Block open changes during transitions
    if (isTransitioning) return
    
    // If prevent close flag is set, reset it and block this close
    if (!nextOpen && preventCloseRef.current) {
      preventCloseRef.current = false
      return
    }
    
    // Prevent rapid open/close cycles
    if (!nextOpen && closeInProgressRef.current) {
      return
    }
    
    // If closing, mark as in progress and schedule with delay
    if (!nextOpen && open) {
      closeInProgressRef.current = true
      setTimeout(() => {
        setOpen(false)
        // Notify external handler if provided
        if (externalOnOpenChange) {
          externalOnOpenChange(false)
        }
      }, 50)
    } else {
      setOpen(nextOpen)
      // Notify external handler if provided
      if (externalOnOpenChange) {
        externalOnOpenChange(nextOpen)
      }
    }
  }, [open, isTransitioning, externalOnOpenChange])

  return (
    <DropdownMenuRoot
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
    >
      {typeof children === 'function' 
        ? children({ 
            open, 
            setOpen: (newOpenState) => {
              // Add delay when closing to ensure animation completes
              if (open && typeof newOpenState === 'boolean' && !newOpenState) {
                setIsTransitioning(true)
                setTimeout(() => {
                  setOpen(false)
                  // Notify external handler if provided
                  if (externalOnOpenChange) {
                    externalOnOpenChange(false)
                  }
                }, 100)
              } else {
                // For boolean values, set directly
                if (typeof newOpenState === 'boolean') {
                  setOpen(newOpenState)
                  // Notify external handler if provided
                  if (externalOnOpenChange) {
                    externalOnOpenChange(newOpenState)
                  }
                } else {
                  // For function updaters, use internal state update
                  setOpen(newOpenState)
                  // We can't notify external handler here as we don't know the next value
                }
              }
            }, 
            preventClose: () => { preventCloseRef.current = true } 
          }) 
        : children}
    </DropdownMenuRoot>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  // Create a ref to track component lifecycle
  const isMountedRef = React.useRef(false)
  const isClosingRef = React.useRef(false)
  
  React.useEffect(() => {
    // Delay setting mounted to ensure DOM is ready
    const mountTimer = setTimeout(() => {
      isMountedRef.current = true
    }, 50)
    
    // Cleanup function with better timing
    return () => {
      clearTimeout(mountTimer)
      
      // Set closing state first
      isClosingRef.current = true
      
      // Then after animation duration, set mounted to false
      setTimeout(() => {
        isMountedRef.current = false
        isClosingRef.current = false
      }, 300) // Longer than animation to ensure completion
    }
  }, [])
  
  // Handler to check lifecycle state
  const handleOutsideInteraction = (event: Event) => {
    if (!isMountedRef.current || isClosingRef.current) {
      event.preventDefault()
    }
  }
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        onEscapeKeyDown={handleOutsideInteraction}
        onPointerDownOutside={handleOutsideInteraction}
        onFocusOutside={handleOutsideInteraction}
        onInteractOutside={handleOutsideInteraction}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
