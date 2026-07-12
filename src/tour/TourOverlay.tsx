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

  // 폰 프레임이 떠 있는 동안에는 프레임 자체의 딤 한 겹만 남긴다 — 투어 딤이 그 위에 겹치면
  // 배경이 이중으로 어두워진다(12C-5 QA). 링(흰 외곽선)은 유지된다.
  const dim = TOUR_DIM_ENABLED && !state.phoneFrame.open

  return (
    <>
      {/* 대상 요소는 각 컴포넌트에서 이미 relative/fixed로 포지셔닝돼 있다 — 여기서는 z-index만 올린다.
          position까지 강제하면 phone-frame처럼 이미 fixed인 대상의 배치가 깨진다. 딤 레이어는
          pointer-events를 받지 않으므로(시각 전용) 이 z-index 승격도 순수하게 "딤 위에 밝게 보이기"
          위한 것이다 — 클릭은 어디서든 항상 가능하다(IMPLEMENTATION_SPEC §3). */}
      <style>{`[data-tour-id="${step.targetId}"] { z-index: 900 !important; }`}</style>
      <TourHighlightRing rect={rect} dim={dim} />
      <TourStepCard
        title={step.title}
        body={step.body}
        stepNumber={state.tour.stepIndex + 1}
        totalSteps={TOUR_STEPS.length}
        exampleText={step.exampleRaw}
        onFillExample={step.exampleRaw ? () => dispatch({ type: 'REQUEST_EXAMPLE_FILL' }) : undefined}
        ctaLabel={step.ctaLabel}
        onCta={step.ctaLabel ? () => dispatch({ type: 'UNLOCK_FREE_MODE' }) : undefined}
        onSkip={() => dispatch({ type: 'UNLOCK_FREE_MODE' })}
      />
    </>
  )
}
