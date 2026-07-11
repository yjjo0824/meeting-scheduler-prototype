import type { ReactNode } from 'react'

interface Props {
  dimmed: boolean
  children: ReactNode
}

// 폰 프레임이 열리면 주최자 뷰는 사라지지 않고 뒤로 물러나며 어두워진다(SPEC §5 무대 구조).
// pointer-events-none(클릭 차단) + inert(포커스·클릭·스크린리더 전부 차단, DOM 레벨 보장) 이중 방어.
export function SlideOverDim({ dimmed, children }: Props) {
  return (
    <div
      className={`transition-all duration-300 ${dimmed ? 'pointer-events-none scale-[0.98] opacity-40 blur-[1px]' : ''}`}
      aria-hidden={dimmed}
      inert={dimmed}
    >
      {children}
    </div>
  )
}
