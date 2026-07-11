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
      <style>{`[data-tour-id="${step.targetId}"] { position: relative !important; z-index: 900 !important; }`}</style>
      <TourClickBlocker />
      <TourHighlightRing targetId={step.targetId} />
      <TourStepCard
        title={step.title}
        body={step.body}
        stepNumber={state.tour.stepIndex + 1}
        totalSteps={TOUR_STEPS.length}
      />
    </>
  )
}
