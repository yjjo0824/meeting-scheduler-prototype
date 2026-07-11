import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'text'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'rounded-card bg-brand-500 px-4 py-2.5 font-semibold text-white hover:bg-brand-600',
  secondary: 'rounded-card bg-surface-muted px-4 py-2.5 font-semibold text-ink-900 hover:bg-border',
  text: 'bg-transparent px-0 py-1 font-medium text-ink-700 underline-offset-2 hover:underline',
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`transition disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  )
}
