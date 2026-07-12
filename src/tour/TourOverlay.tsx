import { useEffect, useRef } from 'react'
import { useAppState } from '../state/AppContext'
import { TOUR_STEPS } from './tourSteps'
import { TourHighlightRing } from './TourHighlightRing'
import { TourStepCard } from './TourStepCard'
import { getTourTargetElement } from './TourTargetRegistry'
import { useTourTargetRect } from './useTourTargetRect'

// 딤(스포트라이트) 표시 여부 — IMPLEMENTATION_SPEC §3: 딤은 시각 안내 전용이고 인터랙션을
// 잠그지 않는다. 딤 자체가 문제가 되면 이 상수 하나로 끄는 폴백이 가능하다(링·카드는 유지됨).
export const TOUR_DIM_ENABLED = true

export function TourOverlay() {
  const { state, dispatch } = useAppState()
  const step = TOUR_STEPS[state.tour.stepIndex]
  // TourHighlightRing(스포트라이트)과 TourStepCard(카드 배치 충돌 회피)가 같은 측정치를 공유한다.
  const rect = useTourTargetRect(step?.targetId ?? '')
  const wasActiveRef = useRef(false)

  useEffect(() => {
    if (!step) return
    if (step.isComplete(state)) {
      const next = state.tour.stepIndex + 1
      if (next < TOUR_STEPS.length) {
        dispatch({ type: 'SET_TOUR_STEP', stepIndex: next })
      }
      // 마지막 단계(체험 잠금 해제)는 UNLOCK_FREE_MODE 자체가 tour.active=false를 세팅하므로
      // 여기서 별도로 투어를 종료하지 않는다.
    }
  }, [state, step, dispatch])

  // Esc로 즉시 종료(확인 모달 없음). UNLOCK_FREE_MODE 하나로 "투어 종료 + 체험 기능 잠금 해제"를
  // 함께 수행한다 — 카드의 [투어 건너뛰기]/마지막 단계 [체험 시작하기]와 의미가 같다.
  useEffect(() => {
    if (!state.tour.active) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'UNLOCK_FREE_MODE' })
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.tour.active, dispatch])

  // 투어가 끝나는 순간(활성→비활성) 방금까지 강조되던 대상으로 포커스를 되돌린다 — 카드가
  // 사라지며 포커스가 body로 흘러가 스크린리더 사용자가 맥락을 잃지 않게 한다.
  useEffect(() => {
    if (!state.tour.active && wasActiveRef.current && step) {
      getTourTargetElement(step.targetId)?.focus?.()
    }
    wasActiveRef.current = state.tour.active
  }, [state.tour.active, step])

  if (!state.tour.active || !step) return null

  // 단계별 딤·링 설정(tourSteps.ts) — IMPLEMENTATION_SPEC §3: 필요한 곳에만 최소로 쓴다.
  // 폰 프레임이 떠 있는 동안에는 어떤 설정이든 투어 딤을 얹지 않는다(프레임 자체 딤 한 겹만 —
  // 12C-5 QA의 이중 딤 방지를 설정과 무관한 안전망으로 유지).
  const dim = TOUR_DIM_ENABLED && step.dim && !state.phoneFrame.open
  const ring = step.ring

  return (
    <>
      {/* 대상 요소는 각 컴포넌트에서 이미 relative/fixed로 포지셔닝돼 있다 — 여기서는 z-index만 올린다.
          position까지 강제하면 phone-frame처럼 이미 fixed인 대상의 배치가 깨진다. 딤 레이어는
          pointer-events를 받지 않으므로(시각 전용) 이 z-index 승격도 순수하게 "딤 위에 밝게 보이기"
          위한 것이다 — 클릭은 어디서든 항상 가능하다(IMPLEMENTATION_SPEC §3). */}
      <style>{`[data-tour-id="${step.targetId}"] { z-index: 900 !important; }`}</style>
      {(dim || ring) && <TourHighlightRing rect={rect} dim={dim} ring={ring} />}
      {/* 카드 골격은 TourStepCard 하나가 담당하고, 여기서는 단계별로 달라지는 것만 채운다:
          문구(title/body), 보조 콘텐츠(2단계 예시 문장 박스), 핵심 행동(2단계 예시 채우기 /
          4단계 체험 시작 — 라벨·동작만 다르고 버튼 스타일은 공용 Button으로 동일). */}
      <TourStepCard
        stepNumber={state.tour.stepIndex + 1}
        totalSteps={TOUR_STEPS.length}
        title={step.title}
        body={step.body}
        auxiliaryContent={
          step.exampleRaw ? (
            <div className="rounded-chip bg-surface-muted p-3">
              <p className="text-xs text-ink-500">예시 문장</p>
              <p className="mt-heading-gap text-sm text-ink-700">“{step.exampleRaw}”</p>
            </div>
          ) : undefined
        }
        primaryAction={
          step.exampleRaw
            ? { label: '예시 문장 채우기', onClick: () => dispatch({ type: 'REQUEST_EXAMPLE_FILL' }) }
            : step.ctaLabel
              ? { label: step.ctaLabel, onClick: () => dispatch({ type: 'UNLOCK_FREE_MODE' }) }
              : undefined
        }
        onSkip={() => dispatch({ type: 'UNLOCK_FREE_MODE' })}
      />
    </>
  )
}
