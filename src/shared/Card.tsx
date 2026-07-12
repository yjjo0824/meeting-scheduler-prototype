import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  elevated?: boolean
  /* 폰 프레임처럼 좁은 컨텍스트에서는 padding을 한 단계 줄인다(card-pad-sm 토큰). */
  dense?: boolean
}

/* 카드 배경(bg-surface-card)·라운드(rounded-card)·padding(p-card-pad)은 전부 index.css 토큰에서
   온다 — 네 화면의 카드가 같은 언어를 공유하고, 한 곳에서 함께 바뀐다. */
export function Card({ children, elevated = false, dense = false, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-card bg-surface-card ${dense ? 'p-card-pad-sm' : 'p-card-pad'} ${elevated ? 'shadow-elevated' : 'shadow-card'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
