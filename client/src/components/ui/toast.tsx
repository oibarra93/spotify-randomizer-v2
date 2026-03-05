import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:left-auto sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:opacity-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:opacity-80 data-[swipe=start]:translate-x-0 data-[swipe=start]:opacity-100 dark:border-slate-800",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground dark:bg-slate-900 dark:text-white",
        destructive:
          "destructive group border-red-500 bg-red-50 text-red-500 dark:border-red-700 dark:bg-red-700/50 dark:text-red-50",
        
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & {
    action?: React.ReactNode
  }

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, action, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="grid flex-1 gap-1">
        {props.children}
      </div>
      {action}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-1 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:pointer-events-none dark:hover:bg-slate-800 dark:focus:bg-slate-800",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
export type { ToastProps }

