import { AppProvider, useAppState } from './state/AppContext'
import { HostDashboard } from './screens/HostDashboard/HostDashboard'
import { ParticipantPhoneFrame } from './screens/ParticipantPhoneFrame/ParticipantPhoneFrame'
import { TradeoffCandidates } from './screens/TradeoffCandidates/TradeoffCandidates'
import { SlideOverDim } from './shared/SlideOverDim'

function AppShell() {
  const { state } = useAppState()

  return (
    <>
      <SlideOverDim dimmed={state.phoneFrame.open}>
        {state.screen === 'host' && <HostDashboard />}
        {state.screen === 'tradeoff' && <TradeoffCandidates />}
      </SlideOverDim>
      <ParticipantPhoneFrame />
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
