import { useEffect, useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { parseChips } from '../../parser/ruleBasedParser'
import { useAppState } from '../../state/AppContext'
import type { Chip } from '../../types/domain'
import { CalendarPrefillList } from './CalendarPrefillList'
import { ChipReviewList } from './ChipReviewList'
import { FreeTextInput } from './FreeTextInput'
import { LockedResponseView } from './LockedResponseView'
import { PhoneContextHeader } from './PhoneContextHeader'
import { TrustNotice } from './TrustNotice'

export function ParticipantPhoneFrame() {
  const { state, dispatch } = useAppState()
  const personId = state.phoneFrame.viewingPersonId
  const person = state.people.find((p) => p.id === personId) ?? null

  const [draftRaw, setDraftRaw] = useState('')
  const [draftChips, setDraftChips] = useState<Chip[] | null>(null)

  useEffect(() => {
    setDraftRaw('')
    setDraftChips(null)
  }, [person?.id, state.phoneFrame.open])

  if (!state.phoneFrame.open || !person) return null

  const organizer = RAW_SEED.people.find((p) => p.id === RAW_SEED.meeting.organizer)
  const isLocked = state.confirmedMeeting !== null
  // 아직 응답하지 않은 사람은 스스로 입력하기 전까지 빈 상태로 시작한다 — seed에 미리 채워둔
  // "정답" chips는 투어 대본(평가자가 직접 타이핑)의 재료일 뿐, 응답 전 참여자 화면에 먼저 보이면 안 된다.
  const chipsToReview = draftChips ?? (state.hasResponded[person.id] ? person.response.chips : [])

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
    })
    dispatch({ type: 'CLOSE_PHONE_FRAME' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" data-tour-id="phone-frame">
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
        <PhoneContextHeader person={person} meeting={RAW_SEED.meeting} organizerName={organizer?.name ?? ''} />

        {isLocked ? (
          <LockedResponseView
            person={person}
            reported={state.reportedByPersonId[person.id] ?? false}
            onReport={() => dispatch({ type: 'REPORT_UNAVAILABLE', personId: person.id })}
          />
        ) : (
          <>
            <CalendarPrefillList
              person={person}
              corrections={state.calendarCorrections[person.id] ?? {}}
              onApplyCorrection={(day, hour, kind) =>
                dispatch({ type: 'APPLY_CALENDAR_CORRECTION', personId: person.id, day, hour, kind })
              }
              onUndoCorrection={(day, hour) =>
                dispatch({ type: 'UNDO_CALENDAR_CORRECTION', personId: person.id, day, hour })
              }
            />
            <FreeTextInput value={draftRaw} onChange={handleDraftChange} />
            <ChipReviewList chips={chipsToReview} onChangeChips={setDraftChips} />
            <TrustNotice />
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              응답 보내기
            </button>
            <p className="mt-2 text-xs text-slate-400">확정 전까지 언제든 수정할 수 있어요</p>
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
    </div>
  )
}
