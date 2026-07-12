import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Rect } from './useTourTargetRect'

interface Props {
  title: string
  body: string
  stepNumber: number
  totalSteps: number
  targetRect: Rect | null
  exampleText?: string
  onFillExample?: () => void
  ctaLabel?: string
  onCta?: () => void
  // 투어 건너뛰기(오버레이 제거 + 체험 기능 잠금 해제) — 모든 단계 카드에 노출된다.
  onSkip: () => void
}

const MARGIN = 32 // 뷰포트 가장자리 여백(px) — 기존 bottom-8/left-8/right-8 = 2rem과 동일
const GAP = 8 // 대상 rect 주변 여유(하이라이트 링 확장분과 맞춘다)

interface Size {
  width: number
  height: number
}

interface Position {
  top: number
  left: number
}

function toEdges(pos: Position, size: Size) {
  return { top: pos.top, left: pos.left, right: pos.left + size.width, bottom: pos.top + size.height }
}

function overlaps(a: Position, aSize: Size, b: Position, bSize: Size): boolean {
  const ea = toEdges(a, aSize)
  const eb = toEdges(b, bSize)
  return ea.left < eb.right && ea.right > eb.left && ea.top < eb.bottom && ea.bottom > eb.top
}

// 카드는 좌측 하단 고정이다(12C-5: 좌우 번갈아 등장 제거) — 역할 체험 패널과 "다른 역할
// 체험하기"/"처음부터 다시 보기" 진입점이 우측 하단에 있으므로 반대쪽에 둔다. 고정 위치가
// 해당 단계의 하이라이트 대상(여유 GAP 포함)을 가리는 경우에만 좌측 상단으로 상하 반전한다
// (좌우 이동 금지). 순수 함수라 실제 DOM 없이도 테스트 가능.
export function chooseCardPosition(
  cardSize: Size,
  targetRect: Rect | null,
  viewport: Size,
  margin: number = MARGIN,
  gap: number = GAP,
): Position {
  const bottomLeft: Position = { top: viewport.height - margin - cardSize.height, left: margin }
  const topLeft: Position = { top: margin, left: margin }

  if (!targetRect) return bottomLeft

  const inflatedTarget: Position = { top: targetRect.top - gap, left: targetRect.left - gap }
  const inflatedSize: Size = { width: targetRect.width + gap * 2, height: targetRect.height + gap * 2 }

  return overlaps(bottomLeft, cardSize, inflatedTarget, inflatedSize) ? topLeft : bottomLeft
}

// SSR(react-dom/server)에서 useLayoutEffect를 쓰면 콘솔 경고가 뜬다(서버에는 레이아웃이 없다) —
// 브라우저에서만 useLayoutEffect를 쓰고, 그 외(SSR)에는 아무 효과가 없는 useEffect로 대체한다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function TourStepCard({
  title,
  body,
  stepNumber,
  totalSteps,
  targetRect,
  exampleText,
  onFillExample,
  ctaLabel,
  onCta,
  onSkip,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const titleId = 'tour-step-title'
  const bodyId = 'tour-step-body'

  // 단계가 바뀔 때마다(제목이 바뀔 때) 카드 제목으로 포커스를 옮겨 스크린리더 사용자에게
  // 새 단계를 알린다("카드 제목 또는 실제 행동 대상으로 포커스 이동" 요구사항).
  useEffect(() => {
    titleRef.current?.focus()
  }, [title])

  // 카드 자체 크기를 측정해 우측하단→우측상단→좌측하단 순으로 대상과 겹치지 않는 위치를 고른다.
  // 스크롤·리사이즈·카드 내용 변화(예시 채우기 등으로 높이가 바뀜) 시 다시 계산한다.
  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return

    function place() {
      if (!card) return
      const { width, height } = card.getBoundingClientRect()
      const viewport = { width: window.innerWidth, height: window.innerHeight }
      setPosition(chooseCardPosition({ width, height }, targetRect, viewport))
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    const observer = new ResizeObserver(place)
    observer.observe(card)

    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      observer.disconnect()
    }
  }, [targetRect, title, body])

  return (
    <div
      ref={cardRef}
      data-tour-card="true"
      role="region"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="fixed z-[900] w-80 max-w-[calc(100vw-4rem)] rounded-2xl bg-white p-4 shadow-xl"
      style={position ? { top: position.top, left: position.left } : { top: MARGIN, left: MARGIN }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {stepNumber} / {totalSteps}단계
        </p>
        {/* 건너뛰기 — 누르면 오버레이가 제거되고 체험 기능이 바로 풀린다(Esc와 동일). */}
        <button
          type="button"
          onClick={onSkip}
          className="px-1 py-1 text-xs text-slate-400 underline hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          투어 건너뛰기
        </button>
      </div>
      <h3
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className="mt-1 text-sm font-semibold text-slate-900 outline-none"
      >
        {title}
      </h3>
      <p id={bodyId} className="mt-1 text-sm text-slate-600">
        {body}
      </p>
      {exampleText && onFillExample && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">예시: "{exampleText}"</p>
          <button
            type="button"
            onClick={onFillExample}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
          >
            예시 문장 채우기
          </button>
        </div>
      )}
      {ctaLabel && onCta && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onCta}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  )
}
