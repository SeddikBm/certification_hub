import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-label-md text-label-md rounded-xl flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none",
          variant === "primary" && "bg-primary text-on-primary hover:bg-on-primary-fixed-variant hover:-translate-y-[2px] active:translate-y-[0px] shadow-sm hover:shadow-md",
          variant === "secondary" && "bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant shadow-sm hover:shadow-md",
          variant === "outline" && "border border-outline text-primary hover:bg-surface-variant",
          variant === "ghost" && "bg-transparent text-primary hover:bg-surface-variant",
          size === "default" && "py-[14px] px-4",
          size === "sm" && "h-9 px-3 text-xs",
          size === "lg" && "h-14 px-8 text-base",
          size === "icon" && "h-10 w-10",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
