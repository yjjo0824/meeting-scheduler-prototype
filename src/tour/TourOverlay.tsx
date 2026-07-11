import { useEffect } from 'react'
import { useAppState } from '../state/AppContext'
import { TOUR_STEPS } from './tourSteps'
import { TourClickBlocker } from './TourClickBlocker'
import { TourHighlightRing } from './TourHighlightRing'
import { TourStepCard } from './TourStepCard'

export function TourOverlay() {
  const { state, dispatch } = useAppState()
  const step = TOUR_STEPS[state.tour.stepIndex]

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

  if (!state.tour.active || !step) return null

  return (
    <>
      {/* 대상 요소는 각 컴포넌트에서 이미 relative/fixed로 포지셔닝돼 있다 — 여기서는 z-index만 올린다.
          position까지 강제하면 phone-frame처럼 이미 fixed인 대상의 배치가 깨진다(문서 흐름에 끼어들어
          스크롤해야 보이는 버그의 원인이었다). */}
      <style>{`[data-tour-id="${step.targetId}"] { z-index: 900 !important; }`}</style>
      <TourClickBlocker />
      <TourHighlightRing targetId={step.targetId} />
      <TourStepCard
        title={step.title}
        body={step.body}
        stepNumber={state.tour.stepIndex + 1}
        totalSteps={TOUR_STEPS.length}
        placement={step.placement}
        exampleText={step.exampleRaw}
        onFillExample={step.exampleRaw ? () => dispatch({ type: 'REQUEST_EXAMPLE_FILL' }) : undefined}
      />
    </>
  )
}
