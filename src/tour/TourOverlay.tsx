import { useEffect, useRef } from 'react'
import { useAppState } from '../state/AppContext'
import { TOUR_STEPS } from './tourSteps'
import { TourClickBlocker } from './TourClickBlocker'
import { TourHighlightRing } from './TourHighlightRing'
import { TourStepCard } from './TourStepCard'
import { getTourTargetElement } from './TourTargetRegistry'
import { useTourInert } from './useTourInert'
import { useTourTargetRect } from './useTourTargetRect'

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
      // 마지막 단계(자유 모드 해제)는 UNLOCK_FREE_MODE 자체가 tour.active=false를 세팅하므로
      // 여기서 별도로 투어를 종료하지 않는다.
    }
  }, [state, step, dispatch])

  // Esc로 즉시 종료(확인 모달 없음). UNLOCK_FREE_MODE 하나로 "투어 종료 + 체험 기능 잠금 해제"를
  // 함께 수행한다 — 마지막 단계 카드의 [체험 시작하기] CTA와 의미가 같다(중간에 그만 보고
  // 자유롭게 써본다는 것도 결국 같은 잠금 해제다). 새 전역 액션을 추가하지 않는다.
  useEffect(() => {
    if (!state.tour.active) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'UNLOCK_FREE_MODE' })
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.tour.active, dispatch])

  // 투어 중에는 카드와 현재 단계의 대상만 키보드·포인터로 접근 가능하다 — 그 외 앱 전체는 inert.
  useTourInert(
    state.tour.active && !!step,
    step ? [`[data-tour-id="${step.targetId}"]`, '[data-tour-card="true"]'] : [],
  )

  // 투어가 끝나는 순간(활성→비활성) 방금까지 강조되던 대상으로 포커스를 되돌린다 — 카드가
  // 사라지며 포커스가 body로 흘러가 스크린리더 사용자가 맥락을 잃지 않게 한다.
  useEffect(() => {
    if (!state.tour.active && wasActiveRef.current && step) {
      getTourTargetElement(step.targetId)?.focus?.()
    }
    wasActiveRef.current = state.tour.active
  }, [state.tour.active, step])

  if (!state.tour.active || !step) return null

  return (
    <>
      {/* 대상 요소는 각 컴포넌트에서 이미 relative/fixed로 포지셔닝돼 있다 — 여기서는 z-index만 올린다.
          position까지 강제하면 phone-frame처럼 이미 fixed인 대상의 배치가 깨진다(문서 흐름에 끼어들어
          스크롤해야 보이는 버그의 원인이었다). */}
      <style>{`[data-tour-id="${step.targetId}"] { z-index: 900 !important; }`}</style>
      <TourClickBlocker />
      <TourHighlightRing rect={rect} />
      <TourStepCard
        title={step.title}
        body={step.body}
        stepNumber={state.tour.stepIndex + 1}
        totalSteps={TOUR_STEPS.length}
        targetRect={rect}
        exampleText={step.exampleRaw}
        onFillExample={step.exampleRaw ? () => dispatch({ type: 'REQUEST_EXAMPLE_FILL' }) : undefined}
        ctaLabel={step.ctaLabel}
        onCta={step.ctaLabel ? () => dispatch({ type: 'UNLOCK_FREE_MODE' }) : undefined}
      />
    </>
  )
}
