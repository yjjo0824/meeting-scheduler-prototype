import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../shared/Button'

export interface TourAction {
  label: string
  onClick: () => void
}

interface Props {
  stepNumber: number
  totalSteps: number
  title: string
  body: string
  // 단계별 보조 콘텐츠(예시 문장 박스, 상태 요약 등) — 카드 골격(폭·패딩·타이포·간격)은 공통이고
  // 이 슬롯의 내용물만 단계가 채운다. 없으면 본문까지만 렌더된다(간격 체계는 space-y가 유지).
  auxiliaryContent?: ReactNode
  // 단계별 핵심 행동 — 공용 Button(primary·sm·full)으로만 렌더해 CTA의 높이·라운드·색·폰트가
  // 모든 단계에서 같다. 없는 단계는 행동 영역 자체를 렌더하지 않는다(빈 버튼 영역 금지).
  primaryAction?: TourAction
  // 투어 건너뛰기(오버레이 제거 + 체험 기능 잠금 해제) — 접힌 상태에서도 접근 가능해야
  // 하므로 헤더에 둔다.
  onSkip: () => void
}

// 투어 가이드 카드 — 1/4~4/4 모든 단계가 이 컴포넌트 하나를 쓴다. 골격은 항상 같다:
// ① 헤더(왼쪽 단계 표시 / 오른쪽 건너뛰기·접기) ② 제목 ③ 설명 ④ 보조 콘텐츠(선택)
// ⑤ 핵심 행동 CTA(선택). 폭·패딩·라운드·그림자는 index.css의 토큰(--container-tour-card,
// --spacing-card-pad-sm, --radius-card, shadow-elevated)에서 오고, 단계별로 달라지는 것은
// 문구·보조 콘텐츠·행동뿐이다.
//
// 위치는 우측 하단 스택("처음부터 다시 보기" pill 바로 위, bottom-16 right-4) 고정이다(12C-10).
// 투어가 끝나면 이 카드가 사라진 같은 자리에 "다른 역할 체험하기" pill이 나타나 공간이 자연스럽게
// 이어진다. 자동 이동 로직은 없다(12C-6) — 카드가 하이라이트 대상을 가리는 경우에도 움직이지
// 않고, 헤더의 접기 토글로 본문을 접어 시야를 확보한다. 단계가 바뀌면 다시 펼쳐진 상태로 시작한다.
export function TourStepCard({
  stepNumber,
  totalSteps,
  title,
  body,
  auxiliaryContent,
  primaryAction,
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
      className="fixed bottom-16 right-4 z-[900] w-[var(--container-tour-card)] max-w-[calc(100vw-4rem)] rounded-card bg-surface p-card-pad-sm shadow-elevated"
    >
      {/* 헤더 — 단계 표시·접기 토글·건너뛰기. 접힌 상태에서도 이 줄은 항상 남는다. */}
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
        <div id={bodyId} className="mt-1 space-y-3">
          <p className="text-sm text-ink-700">{body}</p>
          {auxiliaryContent}
          {primaryAction && (
            <Button size="sm" className="w-full" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
