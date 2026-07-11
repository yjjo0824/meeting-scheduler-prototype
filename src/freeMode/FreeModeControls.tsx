import { useAppState } from '../state/AppContext'
import { ResetButton } from './ResetButton'

// 화면 이동(주최자 체험 안에서의 이동)만 다룬다 — 필수/선택 변경은 HostDashboard의
// PersonDetailPanel로 옮겨서, 화면 이동과 조건 편집을 같은 UI 레벨에 두지 않는다.
// 참여자 체험 진입은 HostDashboard의 조건 지도에서 참여자를 선택하는 경로로 이미 분리돼 있다.
export function FreeModeControls() {
  const { state, dispatch } = useAppState()
  if (!state.freeModeUnlocked) return null

  return (
    <div className="fixed bottom-4 right-4 z-[700] w-72 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">자유 모드</p>
        <ResetButton onClick={() => dispatch({ type: 'RESET_ALL' })} />
      </div>

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
          className="rounded border border-slate-300 px-2 py-1 text-slate-600"
        >
          주최자 화면
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'NAVIGATE', screen: 'tradeoff' })}
          className="rounded border border-slate-300 px-2 py-1 text-slate-600"
        >
          트레이드오프
        </button>
        {state.confirmedMeeting && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: 'confirmation' })}
            className="rounded border border-slate-300 px-2 py-1 text-slate-600"
          >
            확정 결과
          </button>
        )}
      </div>
    </div>
  )
}
