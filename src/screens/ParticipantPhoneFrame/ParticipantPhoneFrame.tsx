import { useEffect, useMemo, useRef, useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { slotKey } from '../../engine/slotKey'
import { parseChips } from '../../parser/ruleBasedParser'
import { useAppState } from '../../state/AppContext'
import { applyCalendarCorrections } from '../../state/useSchedule'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
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

  // 세션(참여자 전환 또는 프레임 재오픈) 경계를 렌더 단계에서 동기적으로 감지해 draft를 초기화한다
  // (React 공식 패턴: "Adjusting state when a prop changes"). 이전에는 useEffect에서 초기화했는데,
  // 그 경우 "프레임이 막 열린 첫 렌더"가 아직 이전 세션 값(예: 이전에 보던 사람의 editing=true) 그대로인
  // DOM을 커밋하고, 포커스 트랩이 바로 그 커밋을 기준으로 최초 포커스를 계산해버려 잘못된 요소로
  // 포커스가 가는 문제가 있었다(12B-3 QA). 렌더 중 setState로 즉시 재렌더시키면 커밋되는 첫 DOM부터
  // 이미 올바른 상태라 이 문제가 근본적으로 사라진다.
  const sessionKey = `${personId ?? ''}#${state.phoneFrame.open}`
  const [committedSessionKey, setCommittedSessionKey] = useState<string | null>(null)
  if (committedSessionKey !== sessionKey) {
    setCommittedSessionKey(sessionKey)
    setDraftRaw('')
    setManualChips(null)
    setTextChips([])
    setDraftCorrections(state.calendarCorrections[personId ?? ''] ?? {})
    setJustSubmitted(false)
    if (state.phoneFrame.open) {
      setEditing(!state.hasResponded[personId ?? ''])
    }
  }

  // entered(등장 애니메이션)만 effect로 남긴다 — "닫힘"으로 먼저 그린 뒤 다음 프레임에 "열림"으로
  // 전환해야 CSS transition이 실제로 재생되므로, 위 렌더 단계 동기화와 달리 반드시 커밋 이후에
  // 한 틱 늦게 실행돼야 한다.
  useEffect(() => {
    setEntered(false)
    if (!state.phoneFrame.open) return
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
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

  // useRestoreFocus가 먼저 실행돼야 한다: 두 훅 모두 "open이 true로 바뀐 커밋"에서 자기 effect를
  // 등록하는데, 같은 커밋 안에서 effect는 호출 순서대로 실행된다. useFocusTrap의 effect가 먼저
  // 실행되면 포커스를 다이얼로그 안으로 옮겨버린 "뒤"에 useRestoreFocus가 activeElement를 캡처하게
  // 되어(다이얼로그 내부 요소를 트리거로 잘못 기억함), 닫을 때 엉뚱한 곳으로 복귀하는 문제가 있었다
  // (12B-3 QA). 순서를 바꿔 "열리기 직전 실제 트리거"를 먼저 캡처한 뒤에 초기 포커스를 옮긴다.
  // sessionKey를 함께 넘긴다: open이 계속 true인 채로 역할 체험에서 다른 사람으로 바로 전환되는
  // 경우에도(닫았다 다시 열지 않고) 최초 포커스·복귀 대상 트리거가 새 세션 기준으로 다시
  // 계산되어야 한다(12B-4 QA).
  useRestoreFocus(state.phoneFrame.open, sessionKey)
  useFocusTrap(panelRef, state.phoneFrame.open, getInitialFocus, sessionKey)
  useBodyScrollLock(state.phoneFrame.open)

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
  // (투어 딤 레이어 z-850 위로 패널이 밝게 떠오르지 못하는 버그의 원인이었다).
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
        tabIndex={-1}
        className={`fixed left-1/2 top-1/2 z-50 flex h-[85vh] max-h-[720px] w-[380px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2.5rem] border-8 border-ink-900 bg-surface-card p-5 shadow-elevated outline-none transition-all duration-300 ${
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* 폰 상태바 노치 — 순수 장식(12D-1 참고안의 디바이스 느낌), ink-900 토큰. */}
        <div aria-hidden="true" className="mx-auto -mt-5 mb-3 h-5 w-24 shrink-0 rounded-b-2xl bg-ink-900" />
        {/* 재조율 알림 배너(12C-12.2) — 헤더의 요청 안내와 같은 "주최자 이름 + 행동" 패턴으로,
            주최자의 "다시 조율하기"가 참여자에게 알림으로 도착했음을 표현한다.
            이름은 seed에서 파생. 기존 "다시 조율 중" 배지·수정 가능 동작은 그대로다. */}
        {isRescheduling && !justSubmitted && (
          <p className="mb-3 rounded-chip bg-warn-50 px-3 py-2 text-xs font-bold text-warn-600">
            {organizerName} 님이 회의 시간을 다시 조율하고 있어요
          </p>
        )}
        <PhoneContextHeader meeting={RAW_SEED.meeting} organizerName={organizerName} />

        {isLocked ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LockedResponseView
              person={person}
              slot={state.confirmedMeeting!.slot}
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
          // 스크롤되는 입력 영역과 항상 보이는 하단 제출 CTA를 한 flex 컬럼으로 묶는다(레이아웃
          // 목적만 — 투어 대상은 아니다. 투어 2단계는 폰 프레임 전체(data-tour-id="phone-frame",
          // 패널 루트)를 대상으로 삼는다).
          <div className="flex min-h-0 flex-1 flex-col">
            {/* 입력 콘텐츠만 스크롤되고, 신뢰 문구와 제출 CTA는 항상 하단에 보인다(콘텐츠를 가리지 않음). */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isRescheduling && !justSubmitted && (
                <div className="mt-2">
                  <Badge tone="warn">다시 조율 중</Badge>
                </div>
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
            <div className="space-y-2 border-t border-border pt-3">
              <TrustNotice organizerName={organizerName} />
              <Button onClick={handleSubmit} className="w-full">
                {submitLabel}
              </Button>
              <p className="text-xs text-ink-500">확정 전까지 언제든 수정할 수 있어요</p>
            </div>
          </div>
        )}

        {/* 잠금 상태의 최초 포커스 대상(닫기 또는 신고 버튼 중 닫기를 택함 — 항상 존재해 안정적). */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => dispatch({ type: 'CLOSE_PHONE_FRAME' })}
          className="mt-2 self-start rounded-button px-1 py-2 text-sm text-ink-500 hover:text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          닫기
        </button>
      </div>
    </>
  )
}
