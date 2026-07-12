import { useEffect, useMemo, useRef, useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import { parseChips } from '../../parser/ruleBasedParser'
import { useAppState } from '../../state/AppContext'
import { applyCalendarCorrections } from '../../state/useSchedule'
import { useBodyScrollLock } from '../../shared/useBodyScrollLock'
import { useFocusTrap } from '../../shared/useFocusTrap'
import { useRestoreFocus } from '../../shared/useRestoreFocus'
import type { CalendarCorrection } from '../../state/appState.types'
import type { Chip } from '../../types/domain'
import { CalendarPrefillList } from './CalendarPrefillList'
import { ChipReviewList } from './ChipReviewList'
import { FreeTextInput } from './FreeTextInput'
import { LockedResponseView } from './LockedResponseView'
import { PhoneContextHeader } from './PhoneContextHeader'
import { SubmittedSummaryView } from './SubmittedSummaryView'
import { TrustNotice } from './TrustNotice'

// draft 칩의 출처 태그 — manual(기존 응답에서 출발한 baseline과 그 위의 사용자 수정)과
// text(현재 자연어 입력에서 파생) 레이어를 끝까지 구분한다. text 칩을 manual로 승격하지
// 않아야, 자연어를 다시 쓸 때 이전 파싱 결과가 누적되지 않고 최신 결과로 교체된다.
export interface TaggedDraftChip {
  chip: Chip
  origin: 'manual' | 'text'
}

// 기존 응답 칩(baseline) + 새 자연어 파싱 칩(textChips) 병합 — 동일 조건(type·day·hours)이
// 겹치면 manual 쪽 한 번만 남긴다. 기존 배열을 새 파싱 결과로 덮어쓰지 않는 것이 핵심이다(R8 보존).
// export: draft 병합 규칙을 테스트에서 직접 검증하기 위함.
export function buildDraftChips(baseline: Chip[], textChips: Chip[]): TaggedDraftChip[] {
  const seen = new Set<string>()
  const merged: TaggedDraftChip[] = []
  const tagged: TaggedDraftChip[] = [
    ...baseline.map((chip) => ({ chip, origin: 'manual' as const })),
    ...textChips.map((chip) => ({ chip, origin: 'text' as const })),
  ]
  for (const entry of tagged) {
    const key = `${entry.chip.type}|${entry.chip.day}|${entry.chip.hours.join(',')}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(entry)
  }
  return merged
}

// R3의 확실성 두 단계(불가↔회피)만 탭으로 전환한다 — 병합·조정가능·미분류는 성격이 달라 그대로 둔다.
function toggleChipType(type: Chip['type']): Chip['type'] {
  if (type === '불가') return '회피'
  if (type === '회피') return '불가'
  return type
}

export function ParticipantPhoneFrame() {
  const { state, dispatch } = useAppState()
  const personId = state.phoneFrame.viewingPersonId
  const person = state.people.find((p) => p.id === personId) ?? null

  const [draftRaw, setDraftRaw] = useState('')
  // draft 칩의 단일 소스: manualChips(기존 응답에서 출발해 사용자가 직접 수정한 목록, null = 아직
  // 손대지 않음)와 textChips(현재 자연어 입력에서 파생된 목록)를 합친 것이 편집 화면의 모든 조건
  // 표현과 제출 값이 공유하는 하나의 draft다. 자연어를 다시 입력해도 textChips만 갈아끼워지므로
  // 기존 응답 칩(manual/기존 커밋)은 보존된다(R8: 재조율 시 기존 조건 유지, 12B QA 항목 4·5).
  const [manualChips, setManualChips] = useState<Chip[] | null>(null)
  const [textChips, setTextChips] = useState<Chip[]>([])
  // 캘린더 정정([이 시간 비어 있어요]/[옮길 수 있어요])도 칩과 마찬가지로 제출 전까지는 이
  // 화면 안의 draft에만 머문다 — 제출 CTA를 눌러야 전역 상태(및 HostDashboard의 잠정 추천·
  // 후보 결과)에 한 번에 반영된다. 여는 시점에는 이미 커밋된 정정으로 초기화한다.
  const [draftCorrections, setDraftCorrections] = useState<Record<string, CalendarCorrection>>({})
  // 패널을 항상 "닫힘" 상태(scale-95/opacity-0)로 먼저 그린 뒤, 마운트 직후 한 틱 뒤에
  // "열림" 상태로 전환해 CSS transition이 실제로 등장 애니메이션을 재생하게 한다.
  const [entered, setEntered] = useState(false)
  // IMPLEMENTATION_SPEC §5: 미응답자는 바로 입력 폼, 응답 완료자는 "제출 완료" 요약 먼저 — [응답
  // 수정하기]를 눌러야 편집 폼이 열린다. 매번 여는 시점의 응답 상태로 다시 계산한다.
  const [editing, setEditing] = useState(false)
  // 이 화면에서 방금 제출했는지(체험 맥락에서 완료 상태를 같은 화면에 보여주기 위한 로컬 표식) —
  // 다시 조율 배지·CTA는 "아직 안 보낸" 사람에게만 의미가 있으므로 제출 직후에는 일반 완료 요약을 보여준다.
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => {
    setDraftRaw('')
    setManualChips(null)
    setTextChips([])
    setDraftCorrections(state.calendarCorrections[personId ?? ''] ?? {})
    setEntered(false)
    setJustSubmitted(false)
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
      setTextChips(parseChips({ raw: person.response.raw, calendarEvents: person.calendar, grid: RAW_SEED.grid }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exampleFillSignal])

  // 편집의 출발점: 이미 응답한 사람은 커밋된 응답 전체가 draft 초기값이다(재조율 시 기존 조건 보존).
  // 아직 응답하지 않은 사람은 빈 상태로 시작한다 — seed에 미리 채워둔 "정답" chips는 투어 대본의
  // 재료일 뿐, 응답 전 참여자 화면에 먼저 보이면 안 된다.
  const baselineChips = manualChips ?? (person && state.hasResponded[person.id] ? person.response.chips : [])

  const taggedDraftChips = useMemo(() => buildDraftChips(baselineChips, textChips), [baselineChips, textChips])

  // 진행 중인 정정 draft가 기존 칩을 무효화했다면(예: 방금 비운 슬롯을 가리키던 조정가능 칩)
  // 제출 전에도 검수 목록에서 활성 상태로 남지 않도록 같은 필터링을 미리 보여준다 — 실제 커밋은
  // 제출 시점에 한 번 더 동일한 로직으로 처리된다(state/appReducer.ts). 화면에 보이는 값 = 제출되는 값.
  // applyCalendarCorrections는 칩 객체를 복제하지 않고 filter만 하므로, 참조 동일성으로 살아남은
  // 칩의 출처 태그를 되찾을 수 있다(칩 수정·삭제를 올바른 draft 레이어로 라우팅하기 위함).
  const displayedTaggedChips = useMemo(() => {
    if (!person) return []
    const combined = taggedDraftChips.map((entry) => entry.chip)
    const [preview] = applyCalendarCorrections(
      [{ ...person, response: { ...person.response, chips: combined } }],
      { [person.id]: draftCorrections },
      RAW_SEED.grid,
    )
    const survivors = new Set(preview.response.chips)
    return taggedDraftChips.filter((entry) => survivors.has(entry.chip))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, taggedDraftChips, draftCorrections])

  const chipsToReview = useMemo(() => displayedTaggedChips.map((entry) => entry.chip), [displayedTaggedChips])

  // dialog 접근성 배선. 최초 포커스 대상은 상태(제출 전/제출 완료/잠금)마다 다르지만, 각 상태의
  // 실제 진입 버튼/입력에 data-phone-focus-target을 붙여두고 여기서는 쿼리만 한다 — 그래서 이
  // 함수 자체는 어떤 분기가 렌더됐는지 몰라도 항상 옳은 대상을 찾는다(잠금 상태처럼 그 표식이
  // 없으면 항상 존재하는 닫기 버튼으로 폴백).
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  function getInitialFocus(): HTMLElement | null {
    return panelRef.current?.querySelector<HTMLElement>('[data-phone-focus-target]') ?? closeButtonRef.current
  }

  useFocusTrap(panelRef, state.phoneFrame.open, getInitialFocus)
  useBodyScrollLock(state.phoneFrame.open)
  useRestoreFocus(state.phoneFrame.open)

  useEffect(() => {
    if (!state.phoneFrame.open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_PHONE_FRAME' })
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.phoneFrame.open, dispatch])

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
    // 자연어 입력은 textChips만 갈아끼운다 — 기존 응답에서 온 baseline/manual 칩은 보존된다.
    if (text.trim().length === 0) {
      setTextChips([])
      return
    }
    setTextChips(parseChips({ raw: text, calendarEvents: person.calendar, grid: RAW_SEED.grid }))
  }

  // 칩 수정·삭제는 그 칩이 속한 draft 레이어에만 반영한다 — text 칩을 manual로 승격하지 않는다.
  // (승격하면 이후 자연어를 다시 쓸 때 이전 파싱 결과가 manual에 남아 새 결과와 중복 누적된다.)
  // text 칩에 가한 수정은 자연어를 다시 쓰면 최신 파싱 결과로 함께 교체된다(문장이 text 레이어의 진실).
  function handleToggleChip(index: number) {
    const target = displayedTaggedChips[index]
    if (!target) return
    const updated = { ...target.chip, type: toggleChipType(target.chip.type) }
    if (target.origin === 'manual') {
      setManualChips(baselineChips.map((c) => (c === target.chip ? updated : c)))
    } else {
      setTextChips((prev) => prev.map((c) => (c === target.chip ? updated : c)))
    }
  }

  function handleDeleteChip(index: number) {
    const target = displayedTaggedChips[index]
    if (!target) return
    if (target.origin === 'manual') {
      setManualChips(baselineChips.filter((c) => c !== target.chip))
    } else {
      setTextChips((prev) => prev.filter((c) => c !== target.chip))
    }
  }

  function resetDraft() {
    setDraftRaw('')
    setManualChips(null)
    setTextChips([])
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
    if (state.tour.active) {
      // 투어(데모 인과): 제출 → 폰 프레임 닫힘 → 주최자 화면 복귀 → 재계산 흐름.
      dispatch({ type: 'CLOSE_PHONE_FRAME' })
      return
    }
    // 역할별 체험: 같은 화면에서 "응답을 보냈어요" 완료 상태를 보여주고, 다시 수정할 수 있게 한다.
    resetDraft()
    setEditing(false)
    setJustSubmitted(true)
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
    setJustSubmitted(true)
  }

  const submitLabel = isRescheduling && !justSubmitted ? '수정한 응답 보내기' : '이대로 응답하기'

  // 배경과 패널은 반드시 최상위 형제여야 한다 — 감싸는 wrapper에 position+z-index를 주면 새
  // 스태킹 컨텍스트가 생겨, TourOverlay가 패널에 주입하는 z-index:900이 그 안에 갇혀 버린다
  // (TourClickBlocker의 z-800과 전혀 비교되지 않아 클릭이 전부 막히는 버그의 원인이었다).
  return (
    <>
      {/* 투어 중에는 배경 클릭으로 닫히지 않는다 — 가이드 흐름이 실수로 끊기지 않게 한다.
          Esc는 투어 중에도 동작한다(위 handleKeyDown, TourOverlay의 Esc와 별개로 이 다이얼로그만 닫음). */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => {
          if (!state.tour.active) dispatch({ type: 'CLOSE_PHONE_FRAME' })
        }}
      />
      <div
        ref={panelRef}
        data-tour-id="phone-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-frame-title"
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
              rescheduling={isRescheduling && !justSubmitted}
              onResubmit={handleResubmitAsIs}
            />
          </div>
        ) : (
          // 투어 2단계 전용 대상 — 폰 프레임 전체(헤더 포함)가 아니라 실제 입력 흐름(자연어
          // 입력·이해한 조건 목록·제출 CTA)만 감싼다. tabIndex=-1: 투어 종료 시 여기로 포커스를
          // 되돌릴 수 있게(프로그램적 포커스는 포커스 가능한 요소에만 적용된다).
          <div data-tour-id="phone-core-input" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
            {/* 입력 콘텐츠만 스크롤되고, 신뢰 문구와 제출 CTA는 항상 하단에 보인다(콘텐츠를 가리지 않음). */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isRescheduling && !justSubmitted && (
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
              <ChipReviewList chips={chipsToReview} onToggleType={handleToggleChip} onDelete={handleDeleteChip} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <TrustNotice organizerName={organizerName} />
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                {submitLabel}
              </button>
              <p className="text-xs text-slate-400">확정 전까지 언제든 수정할 수 있어요</p>
            </div>
          </div>
        )}

        {/* 잠금 상태의 최초 포커스 대상(닫기 또는 신고 버튼 중 닫기를 택함 — 항상 존재해 안정적). */}
        <button
          ref={closeButtonRef}
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
