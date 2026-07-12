import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppContext'
import { ParticipantExperienceEntry } from './ParticipantExperienceEntry'
import { ResetButton } from './ResetButton'

// 최상위는 "주최자 체험(화면 이동)"과 "참여자 체험(참여자 화면 진입)"의 전환으로 나뉜다.
// 필수/선택 변경은 HostDashboard의 PersonDetailPanel로 옮겨서, 화면 이동과 조건 편집을
// 같은 UI 레벨에 두지 않는다. 참여자 화면 진입 CTA는 실제 제품 화면(HostDashboard)에는
// 없다 — 여기(체험 레이어)에만 있어 "주최자가 남의 응답을 대신 연다"는 오해를 만들지 않는다.
//
// 접기/펼치기는 컴포넌트 로컬 UI 상태다(전역 상태·액션 추가 없음). 이 컴포넌트는 앱 시작 시
// 한 번만 마운트되므로(freeModeUnlocked가 false일 때는 null만 반환) 기본값 false가 자연스럽게
// "처음 자유 모드가 풀렸을 때는 접힌 상태"를 보장한다. '다시 조율하기'로 확정이 풀리는 순간
// (confirmedMeeting: 값 → null)에도 명시적으로 다시 접어, 펼쳐둔 채로 재조율 화면에 돌아와
// 가이드가 화면을 가리는 문제를 막는다.
export function FreeModeControls() {
  const { state, dispatch } = useAppState()
  const [collapsed, setCollapsed] = useState(true)
  const prevConfirmedRef = useRef(state.confirmedMeeting)

  useEffect(() => {
    if (prevConfirmedRef.current && !state.confirmedMeeting) {
      setCollapsed(true)
    }
    prevConfirmedRef.current = state.confirmedMeeting
  }, [state.confirmedMeeting])

  if (!state.freeModeUnlocked) return null

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[700] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg"
      >
        체험 도구 펼치기
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[700] w-72 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">자유 모드</p>
        <div className="flex items-center gap-2">
          <ResetButton onClick={() => dispatch({ type: 'RESET_ALL' })} />
          <button type="button" onClick={() => setCollapsed(true)} className="text-xs text-slate-400 underline">
            접기
          </button>
        </div>
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

      <ParticipantExperienceEntry
        people={state.people}
        onSelect={(personId) => dispatch({ type: 'OPEN_PHONE_FRAME', personId })}
      />
    </div>
  )
}
