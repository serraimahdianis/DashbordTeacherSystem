"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const SheetContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => {} })

export function Sheet({ children, open, onOpenChange }: { children: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen)
    if (onOpenChange) onOpenChange(newOpen)
  }

  return <SheetContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>{children}</SheetContext.Provider>
}

export function SheetTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext)
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        if (child.props.onClick) {
          child.props.onClick(e)
        }
        onOpenChange(true)
      }
    })
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>
}

export function SheetContent({ children, className, side = "right" }: { children: React.ReactNode, className?: string, side?: "right" | "left" }) {
  const { open, onOpenChange } = React.useContext(SheetContext)
  
  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" ? "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm" : "",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-gray-950", className)} {...props} />
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-500", className)} {...props} />
}