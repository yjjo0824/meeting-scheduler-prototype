import { useEffect, useMemo, useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import { parseChips } from '../../parser/ruleBasedParser'
import { useAppState } from '../../state/AppContext'
import { applyCalendarCorrections } from '../../state/useSchedule'
import type { CalendarCorrection } from '../../state/appState.types'
import type { Chip } from '../../types/domain'
import { CalendarPrefillList } from './CalendarPrefillList'
import { ChipReviewList } from './ChipReviewList'
import { FreeTextInput } from './FreeTextInput'
import { LockedResponseView } from './LockedResponseView'
import { PhoneContextHeader } from './PhoneContextHeader'
import { SubmittedSummaryView } from './SubmittedSummaryView'
import { TrustNotice } from './TrustNotice'

export function ParticipantPhoneFrame() {
  const { state, dispatch } = useAppState()
  const personId = state.phoneFrame.viewingPersonId
  const person = state.people.find((p) => p.id === personId) ?? null

  const [draftRaw, setDraftRaw] = useState('')
  const [draftChips, setDraftChips] = useState<Chip[] | null>(null)
  // 캘린더 정정([이 시간 비어 있어요]/[옮길 수 있어요])도 칩과 마찬가지로 제출 전까지는 이
  // 화면 안의 draft에만 머문다 — 제출 CTA를 눌러야 전역 상태(및 HostDashboard의 잠정 추천·
  // 후보 결과)에 한 번에 반영된다. 여는 시점에는 이미 커밋된 정정으로 초기화한다.
  const [draftCorrections, setDraftCorrections] = useState<Record<string, CalendarCorrection>>({})
  // 패널을 항상 "닫힘" 상태(scale-95/opacity-0)로 먼저 그린 뒤, 마운트 직후 한 틱 뒤에
  // "열림" 상태로 전환해 CSS transition이 실제로 등장 애니메이션을 재생하게 한다.
  const [entered, setEntered] = useState(false)
  // IMPLEMENTATION_SPEC §5: 미응답자는 바로 입력 폼, 응답 완료자는 "제출 완료" 요약 먼저 — [수정하기]를
  // 눌러야 편집 폼이 열린다. 매번 여는 시점의 응답 상태로 다시 계산한다(사람이 바뀌거나 다시 열 때마다).
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setDraftRaw('')
    setDraftChips(null)
    setDraftCorrections(state.calendarCorrections[personId ?? ''] ?? {})
    setEntered(false)
    if (!state.phoneFrame.open) return
    setEditing(!state.hasResponded[personId ?? ''])
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, state.phoneFrame.open])

  useEffect(() => {
    if (!state.exampleFillSignal) return
    if (!person) return
    setDraftRaw(person.response.raw ?? '')
    if (person.response.raw) {
      setDraftChips(parseChips({ raw: person.response.raw, calendarEvents: person.calendar, grid: RAW_SEED.grid }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exampleFillSignal])

  // 아직 응답하지 않은 사람은 스스로 입력하기 전까지 빈 상태로 시작한다 — seed에 미리 채워둔
  // "정답" chips는 투어 대본(평가자가 직접 타이핑)의 재료일 뿐, 응답 전 참여자 화면에 먼저 보이면 안 된다.
  const baseChips = draftChips ?? (person && state.hasResponded[person.id] ? person.response.chips : [])

  // 진행 중인 정정 draft가 기존 칩을 무효화했다면(예: 방금 비운 슬롯을 가리키던 조정가능 칩)
  // 제출 전에도 검수 목록에서 활성 상태로 남지 않도록 같은 필터링을 미리 보여준다 — 실제 커밋은
  // 제출 시점에 한 번 더 동일한 로직으로 처리된다(state/appReducer.ts).
  const chipsToReview = useMemo(() => {
    if (!person) return []
    const [preview] = applyCalendarCorrections(
      [{ ...person, response: { ...person.response, chips: baseChips } }],
      { [person.id]: draftCorrections },
      RAW_SEED.grid,
    )
    return preview.response.chips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, baseChips, draftCorrections])

  if (!state.phoneFrame.open || !person) return null

  const organizer = RAW_SEED.people.find((p) => p.id === RAW_SEED.meeting.organizer)
  const organizerName = organizer?.name ?? ''
  const isLocked = state.confirmedMeeting !== null

  // 다시 조율 상태 파생(새 전역 상태 없이): 참여자의 "참석하기 어려워졌어요" 신고는 확정(잠금)
  // 화면에서만 가능하므로, 신고 기록이 있는데 확정이 풀려 있다 = 확정 후 주최자가 "다시 조율하기"로
  // 되돌린 상태다. 신고 없이 되돌린 자유 모드 탐색에서는 일반 제출 완료 화면으로 동작한다(무해한 축소).
  const isRescheduling = !isLocked && Object.values(state.reportedByPersonId).some(Boolean)

  function handleDraftChange(text: string) {
    setDraftRaw(text)
    if (!person) return
    if (text.trim().length === 0) {
      setDraftChips([])
      return
    }
    setDraftChips(parseChips({ raw: text, calendarEvents: person.calendar, grid: RAW_SEED.grid }))
  }

  function handleSubmit() {
    if (!person) return
    dispatch({
      type: 'SUBMIT_RESPONSE',
      personId: person.id,
      chips: chipsToReview,
      raw: draftRaw.trim().length > 0 ? draftRaw : person.response.raw,
      corrections: draftCorrections,
    })
    dispatch({ type: 'CLOSE_PHONE_FRAME' })
  }

  // 다시 조율 중 "이 조건 그대로 보내기": draft를 건드리지 않고 현재 커밋된 조건 그대로 재제출한다.
  function handleResubmitAsIs() {
    if (!person) return
    dispatch({
      type: 'SUBMIT_RESPONSE',
      personId: person.id,
      chips: person.response.chips,
      raw: person.response.raw,
    })
    dispatch({ type: 'CLOSE_PHONE_FRAME' })
  }

  const submitLabel = isRescheduling ? '수정한 응답 보내기' : '이대로 응답하기'

  // 배경과 패널은 반드시 최상위 형제여야 한다 — 감싸는 wrapper에 position+z-index를 주면 새
  // 스태킹 컨텍스트가 생겨, TourOverlay가 패널에 주입하는 z-index:900이 그 안에 갇혀 버린다
  // (TourClickBlocker의 z-800과 전혀 비교되지 않아 클릭이 전부 막히는 버그의 원인이었다).
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => dispatch({ type: 'CLOSE_PHONE_FRAME' })} />
      <div
        data-tour-id="phone-frame"
        className={`fixed left-1/2 top-1/2 z-50 flex h-[85vh] max-h-[720px] w-[380px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2.5rem] border-8 border-slate-900 bg-white p-5 shadow-2xl transition-all duration-300 ${
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <PhoneContextHeader person={person} meeting={RAW_SEED.meeting} organizerName={organizerName} />

        {isLocked ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LockedResponseView
              person={person}
              slot={state.confirmedMeeting!.slot}
              display={RAW_SEED.schedule_display}
              organizerName={organizerName}
              reported={state.reportedByPersonId[person.id] ?? false}
              onReport={() => dispatch({ type: 'REPORT_UNAVAILABLE', personId: person.id })}
            />
          </div>
        ) : !editing && state.hasResponded[person.id] ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SubmittedSummaryView
              person={person}
              onEdit={() => setEditing(true)}
              rescheduling={isRescheduling}
              onResubmit={handleResubmitAsIs}
            />
          </div>
        ) : (
          <>
            {/* 입력 콘텐츠만 스크롤되고, 신뢰 문구와 제출 CTA는 항상 하단에 보인다(콘텐츠를 가리지 않음). */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isRescheduling && (
                <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  다시 조율 중
                </span>
              )}
              <CalendarPrefillList
                person={person}
                corrections={draftCorrections}
                onApplyCorrection={(day, hour, kind) =>
                  setDraftCorrections((prev) => {
                    const key = slotKey(day, hour)
                    // 이미 정정이 적용된 슬롯은 실행 취소 후에만 다시 정정할 수 있다 —
                    // 중복 추가나 다른 종류(empty/movable)로의 덮어쓰기를 막는다(CalendarPrefillList가
                    // 이미 해당 슬롯의 탭을 비활성화하지만, 상태 레이어에서도 한 번 더 방어한다).
                    if (prev[key]) return prev
                    return { ...prev, [key]: { kind } }
                  })
                }
                onUndoCorrection={(day, hour) =>
                  setDraftCorrections((prev) => {
                    const next = { ...prev }
                    delete next[slotKey(day, hour)]
                    return next
                  })
                }
              />
              <FreeTextInput value={draftRaw} onChange={handleDraftChange} />
              <ChipReviewList chips={chipsToReview} onChangeChips={setDraftChips} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <TrustNotice organizerName={organizerName} />
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                {submitLabel}
              </button>
              <p className="text-xs text-slate-400">확정 전까지 언제든 수정할 수 있어요</p>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: 'CLOSE_PHONE_FRAME' })}
          className="mt-3 self-start text-xs text-slate-400"
        >
          닫기
        </button>
      </div>
    </>
  )
}
