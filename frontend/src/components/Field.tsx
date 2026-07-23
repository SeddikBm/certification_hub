import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
}

export const Field = ({ label, help, className = "", ...props }: Readonly<FieldProps>) => (
  <label className={`field ${className}`}>
    <span>{label}</span>
    <input {...props} />
    {help ? <small>{help}</small> : null}
  </label>
);

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export const SelectField = ({ label, children, className = "", ...props }: Readonly<SelectFieldProps>) => (
  <label className={`field ${className}`}>
    <span>{label}</span>
    <select {...props}>{children}</select>
  </label>
);

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextAreaField = ({ label, className = "", ...props }: Readonly<TextAreaFieldProps>) => (
  <label className={`field ${className}`}>
    <span>{label}</span>
    <textarea {...props} />
  </label>
);
