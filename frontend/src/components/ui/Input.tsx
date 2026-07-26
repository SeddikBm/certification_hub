import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, onRightIconClick, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className={cn(
            "w-full bg-surface-container-lowest text-on-surface border focus:outline-none rounded-xl py-3 font-body-md text-body-md transition-colors placeholder:text-on-surface-variant",
            leftIcon ? "pl-12" : "px-4",
            rightIcon ? "pr-12" : "pr-4",
            error
              ? "border-error focus:border-error"
              : "border-outline-variant focus:border-primary",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <button 
            type={onRightIconClick ? "button" : undefined}
            onClick={onRightIconClick}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors",
              onRightIconClick ? "hover:text-on-surface focus:outline-none cursor-pointer" : "pointer-events-none"
            )}
          >
            <span className="material-symbols-outlined text-[20px]">{rightIcon}</span>
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
