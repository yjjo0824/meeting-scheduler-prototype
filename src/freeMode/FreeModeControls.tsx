import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppContext'
import { ParticipantExperienceEntry } from './ParticipantExperienceEntry'

const PANEL_ID = 'role-experience-panel'

// 역할 중심 체험 도구 — "자유 모드"/"트레이드오프" 같은 내부 상태명 대신, 무엇을 할 수 있는지
// (역할을 바꿔 체험한다)로 말한다. 주최자 체험(화면 이동)과 참여자 체험(참여자 화면 진입)의
// 전환으로 나뉜다. 참여자 화면 진입 CTA는 실제 제품 화면(HostDashboard)에는 없다 — 여기(체험
// 레이어)에만 있어 "주최자가 남의 응답을 대신 연다"는 오해를 만들지 않는다.
// "처음부터 다시 보기"는 여기 없다 — 역할 전환과 전체 리셋은 의미가 달라 EvaluatorResetBar로
// 분리했다(12B-3 QA: 확정된 UX 결정).
//
// 접기/펼치기는 컴포넌트 로컬 UI 상태다(전역 상태·액션 추가 없음). 이 컴포넌트는 앱 시작 시
// 한 번만 마운트되므로(freeModeUnlocked가 false일 때는 null만 반환) 기본값 true(접힘)가 자연스럽게
// "처음 체험 도구가 풀렸을 때는 접힌 상태"를 보장한다. '다시 조율하기'로 확정이 풀리는 순간
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
        aria-expanded={false}
        aria-controls={PANEL_ID}
        className="fixed bottom-4 right-4 z-[700] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        다른 역할 체험하기
      </button>
    )
  }

  return (
    <div
      id={PANEL_ID}
      // 모바일: 좌우 여백을 둔 하단 시트(화면 너비에서 넘치지 않음). md 이상: 기존 288px 고정 패널.
      className="fixed inset-x-4 bottom-4 z-[700] space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:inset-x-auto md:right-4 md:w-72"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">역할을 바꿔 체험해보세요</p>
        <p className="mt-0.5 text-xs text-slate-400">평가용 기능이며 실제 제품에는 보이지 않아요.</p>
      </div>

      <div className="space-y-1.5 border-t border-slate-200 pt-3">
        <p className="text-xs font-semibold text-slate-900">주최자로 체험하기</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: 'host' })}
            className="rounded border border-slate-300 px-2 py-1 text-slate-600"
          >
            응답 현황 보기
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'NAVIGATE', screen: 'tradeoff' })}
            className="rounded border border-slate-300 px-2 py-1 text-slate-600"
          >
            후보 시간 비교하기
          </button>
          {state.confirmedMeeting && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'NAVIGATE', screen: 'confirmation' })}
              className="rounded border border-slate-300 px-2 py-1 text-slate-600"
            >
              확정 결과 보기
            </button>
          )}
        </div>
      </div>

      <ParticipantExperienceEntry
        people={state.people}
        onSelect={(personId) => dispatch({ type: 'OPEN_PHONE_FRAME', personId })}
      />

      <div className="flex justify-end border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-expanded={true}
          aria-controls={PANEL_ID}
          className="shrink-0 text-xs text-slate-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          접기
        </button>
      </div>
    </div>
  )
}
