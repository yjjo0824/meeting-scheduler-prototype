import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
}

export function Card({ children, elevated = false, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-card bg-surface p-6 ${elevated ? 'shadow-elevated' : 'shadow-card'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
