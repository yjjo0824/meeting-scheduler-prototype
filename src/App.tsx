import { AppProvider, useAppState } from './state/AppContext'

function DebugSchedulePanel() {
  const { state, dispatch, schedule } = useAppState()
  const doyun = state.people.find((p) => p.id === 'doyun')!

  return (
    <div className="mx-auto max-w-xl space-y-4 p-8 font-mono text-sm text-slate-700">
      <h1 className="text-base font-semibold text-slate-900">상태 관리 디버그 (4단계, 5단계에서 대체 예정)</h1>
      <p>완벽 슬롯: {schedule.perfectSlots.length === 0 ? '없음' : schedule.perfectSlots.map((s) => `${s.day}${s.hour}`).join(', ')}</p>
      <p>후보군 수: {schedule.groups.length}</p>
      <p>도윤 응답 상태: {state.hasResponded.doyun ? '응답 완료' : '미응답'}</p>
      <button
        type="button"
        className="rounded bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40"
        disabled={state.hasResponded.doyun}
        onClick={() =>
          dispatch({ type: 'SUBMIT_RESPONSE', personId: 'doyun', chips: doyun.response.chips, raw: doyun.response.raw })
        }
      >
        도윤 응답 제출(디버그)
      </button>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <DebugSchedulePanel />
    </AppProvider>
  )
}

export default App
