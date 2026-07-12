import { useEffect, useRef, useState } from 'react'

interface Props {
  title: string
  body: string
  stepNumber: number
  totalSteps: number
  exampleText?: string
  onFillExample?: () => void
  ctaLabel?: string
  onCta?: () => void
  // 투어 건너뛰기(오버레이 제거 + 체험 기능 잠금 해제) — 접힌 상태에서도 접근 가능해야
  // 하므로 헤더에 둔다.
  onSkip: () => void
}

// 투어 단계 카드 — 어떤 뷰포트 크기에서도 좌측 하단 고정이다(12C-6: 상하 반전을 포함한 모든
// 자동 이동 로직 제거). 카드가 하이라이트 대상을 가리는 경우에도 움직이지 않는다 — 대신
// 헤더의 접기 토글로 본문을 접어 시야를 확보한다. 단계가 바뀌면 다시 펼쳐진 상태로 시작한다.
export function TourStepCard({
  title,
  body,
  stepNumber,
  totalSteps,
  exampleText,
  onFillExample,
  ctaLabel,
  onCta,
  onSkip,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const titleId = 'tour-step-title'
  const bodyId = 'tour-step-body'

  // 단계 전환(제목 변경)을 렌더 단계에서 동기 감지해 접힘을 해제한다(React 공식 패턴:
  // "Adjusting state when a prop changes") — 새 단계의 안내는 항상 펼쳐진 채로 시작한다.
  const [lastTitle, setLastTitle] = useState(title)
  if (lastTitle !== title) {
    setLastTitle(title)
    setCollapsed(false)
  }

  // 단계가 바뀔 때마다(제목이 바뀔 때) 카드 제목으로 포커스를 옮겨 스크린리더 사용자에게
  // 새 단계를 알린다.
  useEffect(() => {
    titleRef.current?.focus()
  }, [title])

  return (
    <div
      data-tour-card="true"
      role="region"
      aria-labelledby={titleId}
      aria-describedby={collapsed ? undefined : bodyId}
      className="fixed bottom-8 left-8 z-[900] w-80 max-w-[calc(100vw-4rem)] rounded-card bg-surface p-4 shadow-elevated"
    >
      {/* 헤더 — 단계 표시·제목·접기 토글·건너뛰기. 접힌 상태에서도 이 줄은 항상 남는다. */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-500">
          {stepNumber} / {totalSteps}단계
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSkip}
            className="px-1 py-1 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            투어 건너뛰기
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            className="px-1 py-1 text-xs text-ink-500 underline hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {collapsed ? '펼치기' : '접기'}
          </button>
        </div>
      </div>
      <h3
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className="mt-1 text-sm font-semibold text-ink-900 outline-none"
      >
        {title}
      </h3>

      {!collapsed && (
        <div id={bodyId}>
          <p className="mt-1 text-sm text-ink-700">{body}</p>
          {exampleText && onFillExample && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs text-ink-500">예시: "{exampleText}"</p>
              <button
                type="button"
                onClick={onFillExample}
                className="rounded border border-border px-2 py-1 text-xs text-ink-700"
              >
                예시 문장 채우기
              </button>
            </div>
          )}
          {ctaLabel && onCta && (
            <div className="mt-3 border-t border-border pt-3">
              <button
                type="button"
                onClick={onCta}
                className="w-full rounded-button bg-action-primary px-3 py-2 text-sm font-medium text-white"
              >
                {ctaLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
