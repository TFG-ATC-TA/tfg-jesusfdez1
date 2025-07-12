/**
 * Componente de campo de entrada reutilizable
 * Proporciona estilos consistentes y accesibilidad para inputs
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Props del componente Input
 * Extiende todas las propiedades nativas de HTMLInputElement
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Componente Input principal
 * Renderiza un campo de entrada con estilos consistentes y soporte para ref
 * @param className - Clases CSS adicionales
 * @param type - Tipo de input (text, email, password, etc.)
 * @param ref - Referencia al elemento DOM
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
