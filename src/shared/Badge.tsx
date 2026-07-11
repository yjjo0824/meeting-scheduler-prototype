import type { ReactNode } from 'react'

type Tone = 'brand' | 'neutral' | 'warn' | 'success' | 'danger'

interface Props {
  tone?: Tone
  children: ReactNode
}

const TONE_CLASS: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  neutral: 'bg-surface-muted text-ink-700',
  warn: 'bg-warn-50 text-warn-600',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
}

export function Badge({ tone = 'neutral', children }: Props) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-bold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}
