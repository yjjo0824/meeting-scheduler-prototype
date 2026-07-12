import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'text'
type Size = 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/* 네 제품 화면의 버튼 위계·치수 단일 출처 — 높이(h-control/h-control-sm)와 라운드(rounded-button)는
   index.css의 component 토큰에서 온다. 한 화면에서 primary는 하나만 가장 강하게 보여야 하고,
   보조 행동은 secondary/text로 낮춘다. */
const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'rounded-button bg-action-primary font-semibold text-white hover:bg-action-primary-strong active:bg-action-primary-strong',
  secondary: 'rounded-button bg-action-secondary font-semibold text-ink-900 hover:bg-border',
  text: 'rounded-button bg-transparent font-medium text-ink-700 underline-offset-2 hover:underline',
}

/* text 변형도 같은 높이를 가져 최소 클릭 영역(44px/36px)이 일관된다 — 시각적으로는 배경이 없어
   가볍게 보이지만 터치 타깃은 동일하다. */
const SIZE_CLASS: Record<Size, string> = {
  md: 'h-control px-4 text-[15px]',
  sm: 'h-control-sm px-3 text-sm',
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-40 ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  )
}
