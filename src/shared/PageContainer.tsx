import type { HTMLAttributes, ReactNode } from 'react'

type Width = 'page' | 'content' | 'narrow'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /* page: 대시보드형 넓은 화면(1400px) / content: 후보 비교 등 읽기 중심(42rem) /
     narrow: 확정 결과 등 단일 컬럼(36rem). 값은 index.css의 --container-* 토큰. */
  width?: Width
}

const WIDTH_CLASS: Record<Width, string> = {
  page: 'max-w-page',
  content: 'max-w-content',
  narrow: 'max-w-content-narrow',
}

/* 네 제품 화면 공통 페이지 컨테이너 — 최대 너비·좌우 여백·섹션 간격(space-y-section)을 한 곳에서
   제어한다. 화면 구조(내부 콘텐츠)는 각 화면의 책임이고, 여기는 바깥 틀만 담당한다. */
export function PageContainer({ width = 'page', className = '', children, ...rest }: Props) {
  return (
    <div className={`mx-auto ${WIDTH_CLASS[width]} space-y-section p-4 sm:p-8 ${className}`} {...rest}>
      {children}
    </div>
  )
}
