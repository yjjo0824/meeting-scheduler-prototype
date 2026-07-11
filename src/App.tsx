import { useEffect } from 'react'
import { AppProvider, useAppState } from './state/AppContext'
import { HostDashboard } from './screens/HostDashboard/HostDashboard'
import { ParticipantPhoneFrame } from './screens/ParticipantPhoneFrame/ParticipantPhoneFrame'
import { TradeoffCandidates } from './screens/TradeoffCandidates/TradeoffCandidates'
import { Confirmation } from './screens/Confirmation/Confirmation'
import { SlideOverDim } from './shared/SlideOverDim'
import { MobileGuardNotice } from './shared/MobileGuardNotice'
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

function AppShell() {
  const { state } = useAppState()
  useTourAutoNavigate()

  return (
    <>
      <MobileGuardNotice />
      <SlideOverDim dimmed={state.phoneFrame.open}>
        {state.screen === 'host' && <HostDashboard />}
        {state.screen === 'tradeoff' && <TradeoffCandidates />}
        {state.screen === 'confirmation' && <Confirmation />}
      </SlideOverDim>
      <ParticipantPhoneFrame />
      <TourOverlay />
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
