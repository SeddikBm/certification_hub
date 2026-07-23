import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export const Button = ({ children, icon, variant = "primary", className = "", ...props }: Readonly<ButtonProps>) => (
  <button className={`button button-${variant} ${className}`} {...props}>
    {icon}
    <span>{children}</span>
  </button>
);
