import { useEffect } from 'react'
import { AppProvider, useAppState } from './state/AppContext'
import { HostDashboard } from './screens/HostDashboard/HostDashboard'
import { ParticipantPhoneFrame } from './screens/ParticipantPhoneFrame/ParticipantPhoneFrame'
import { TradeoffCandidates } from './screens/TradeoffCandidates/TradeoffCandidates'
import { Confirmation } from './screens/Confirmation/Confirmation'
import { SlideOverDim } from './shared/SlideOverDim'
import { MobileGuardNotice } from './shared/MobileGuardNotice'
import { useIsNarrowViewport } from './shared/useIsNarrowViewport'
import { TourOverlay } from './tour/TourOverlay'
import { FreeModeControls } from './freeMode/FreeModeControls'

// 투어 진행 중(자유 모드 해제 전)에만 자동 전환한다: 도윤 응답이 도착해 phoneFrame이 닫히고
// 전원이 응답을 마쳤으면 host → tradeoff로 넘어간다(SPEC §5 비트3의 "복귀 → 재계산 → 트레이드오프").
// 자유 모드에서는 사용자가 직접 화면을 선택하므로 이 효과는 개입하지 않는다.
function useTourAutoNavigate() {
  const { state, dispatch, schedule } = useAppState()

  useEffect(() => {
    if (state.freeModeUnlocked) return
    if (state.phoneFrame.open) return
    if (state.confirmedMeeting) return
    if (state.screen !== 'host') return

    const allResponded = state.people.every((p) => state.hasResponded[p.id])
    if (allResponded && schedule.groups.length > 0) {
      dispatch({ type: 'NAVIGATE', screen: 'tradeoff' })
    }
  }, [
    state.freeModeUnlocked,
    state.phoneFrame.open,
    state.confirmedMeeting,
    state.screen,
    state.hasResponded,
    state.people,
    schedule.groups.length,
    dispatch,
  ])
}

// 모바일에서는 데스크톱 가이드 투어를 제공하지 않는다(buildInitialState가 좁은 화면에서 이미
// tour.active=false로 시작한다) — 그런데 체험 도구(FreeModeControls)의 잠금 해제는 지금까지
// UNLOCK_FREE_MODE(투어 마지막 단계) 경로로만 일어났으므로, 모바일에는 잠금을 풀 방법이 아예
// 없었다. 데스크톱 투어 상태를 억지로 "완료 처리"하지 않고, 모바일 진입 자체를 잠금 해제 조건으로
// 삼는 최소 분기만 추가한다 — 기존 UNLOCK_FREE_MODE를 그대로 재사용하고(새 액션 없음), 이미
// 풀려 있으면 아무 것도 하지 않는다.
function useMobileExperienceUnlock(isNarrow: boolean) {
  const { state, dispatch } = useAppState()

  useEffect(() => {
    if (!isNarrow) return
    if (state.freeModeUnlocked) return
    dispatch({ type: 'UNLOCK_FREE_MODE' })
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
