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

/* 배지 높이는 component 토큰(h-badge)에서 온다 — 네 화면의 상태 배지가 같은 크기를 공유한다. */
export function Badge({ tone = 'neutral', children }: Props) {
  return (
    <span
      className={`inline-flex h-badge items-center whitespace-nowrap rounded-pill px-2.5 text-xs font-bold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}
