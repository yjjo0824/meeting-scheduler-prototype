import { useEffect } from 'react'
import { AppProvider, useAppState } from './state/AppContext'
import type { AppState } from './state/appState.types'
import { HostDashboard } from './screens/HostDashboard/HostDashboard'
import { ParticipantPhoneFrame } from './screens/ParticipantPhoneFrame/ParticipantPhoneFrame'
import { TradeoffCandidates } from './screens/TradeoffCandidates/TradeoffCandidates'
import { Confirmation } from './screens/Confirmation/Confirmation'
import { SlideOverDim } from './shared/SlideOverDim'
import { MobileGuardNotice } from './shared/MobileGuardNotice'
import { useIsNarrowViewport } from './shared/useIsNarrowViewport'
import { TourOverlay } from './tour/TourOverlay'
import { FreeModeControls } from './freeMode/FreeModeControls'
import { EvaluatorResetBar } from './freeMode/EvaluatorResetBar'

// 투어가 진행 중일 때만 자동 전환한다: 도윤 응답이 도착해 phoneFrame이 닫히고 전원이 응답을
// 마쳤으면 host → tradeoff로 넘어간다(SPEC §5 비트3의 "복귀 → 재계산 → 트레이드오프").
// 투어가 아닐 때는 사용자가 직접 화면을 선택하므로 이 효과는 개입하지 않는다.
//
// 판정 기준은 반드시 tour.active여야 한다 — 이전에는 freeModeUnlocked를 "투어 진행 중"의 대리
// 조건으로 썼는데(12C-5에서 수정), 12B-3에서 모바일 진입이 keepTourActive:true로 잠금만 풀게
// 되면서 두 상태가 분리됐다: 창이 한 번이라도 768px 아래로 내려갔다 돌아오면(반응형 확인 등)
// freeModeUnlocked=true인 채 투어가 계속되고, 그 뒤 도윤 제출 시 이 효과가 조기 반환되어
// 트레이드오프 자동 전환이 영구히 발화하지 않는 버그가 있었다.
// export: 효과(useEffect)는 SSR 테스트로 실행할 수 없으므로, 전진 판정만 순수 함수로 분리해
// 그 자체를 테스트한다.
export function shouldAutoNavigateToTradeoff(state: AppState, groupCount: number): boolean {
  if (!state.tour.active) return false
  if (state.phoneFrame.open) return false
  if (state.confirmedMeeting) return false
  if (state.screen !== 'host') return false
  const allResponded = state.people.every((p) => state.hasResponded[p.id])
  return allResponded && groupCount > 0
}

function useTourAutoNavigate() {
  const { state, dispatch, schedule } = useAppState()

  useEffect(() => {
    if (shouldAutoNavigateToTradeoff(state, schedule.groups.length)) {
      dispatch({ type: 'NAVIGATE', screen: 'tradeoff' })
    }
  }, [state, schedule.groups.length, dispatch])
}

// 모바일에서는 데스크톱 가이드 투어를 제공하지 않는다(좁은 화면에서는 TourOverlay 자체를
// 렌더링하지 않는다 — 아래 AppShell 참고) — 그런데 체험 도구(FreeModeControls)의 잠금 해제는
// 지금까지 UNLOCK_FREE_MODE(투어 마지막 단계) 경로로만 일어났으므로, 모바일에는 잠금을 풀 방법이
// 아예 없었다. 모바일 진입 자체를 잠금 해제 조건으로 삼는 최소 분기를 추가하되(기존
// UNLOCK_FREE_MODE 재사용, 새 액션 없음), keepTourActive:true를 넘겨 tour.active는 건드리지
// 않는다 — 그래야 데스크톱에서 투어가 진행되던 도중 창을 좁혔다 되돌려도(예: 반응형 확인) 투어가
// 완료 처리되지 않고 하던 단계 그대로 이어간다(12B-3 QA: 모바일 진입이 투어를 영구 종료시키던 버그).
function useMobileExperienceUnlock(isNarrow: boolean) {
  const { state, dispatch } = useAppState()

  useEffect(() => {
    if (!isNarrow) return
    if (state.freeModeUnlocked) return
    dispatch({ type: 'UNLOCK_FREE_MODE', keepTourActive: true })
  }, [isNarrow, state.freeModeUnlocked, dispatch])
}

// export: 테스트가 임의의 state(예: 투어 진행 중)를 AppProvider에 직접 주입해 좁은 화면에서
// TourOverlay가 숨는지 확인할 수 있게 한다(App은 buildInitialState()로 고정돼 주입 지점이 없다).
export function AppShell() {
  const { state } = useAppState()
  useTourAutoNavigate()
  const isNarrow = useIsNarrowViewport()
  useMobileExperienceUnlock(isNarrow)

  return (
    <>
      {/* MobileGuardNotice는 768px 미만에서 상단에 뜨는 권장 안내 배너일 뿐, 아래 제품 콘텐츠를
          가리거나 렌더링을 막지 않는다(12A.8: 전체 차단 방식을 되돌림 — 전용 모바일 레이아웃은
          12B-1에서 추가됨). */}
      <MobileGuardNotice />
      <EvaluatorResetBar />
      <SlideOverDim dimmed={state.phoneFrame.open}>
        {state.screen === 'host' && <HostDashboard />}
        {state.screen === 'tradeoff' && <TradeoffCandidates />}
        {state.screen === 'confirmation' && <Confirmation />}
      </SlideOverDim>
      <ParticipantPhoneFrame />
      {/* 좁은 화면에서는 TourOverlay를 아예 렌더링하지 않는다 — 데스크톱 전용 타깃(data-tour-id)에
          맞춰 만들어진 하이라이트·클릭 블로커를 모바일 뷰 위에 잘못 씌우지 않기 위함이다. state.tour는
          건드리지 않으므로, 다시 768px 이상으로 넓히면 하던 자리(active/stepIndex) 그대로 복귀한다. */}
      {!isNarrow && <TourOverlay />}
      <FreeModeControls />
    </>
  )
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default App
