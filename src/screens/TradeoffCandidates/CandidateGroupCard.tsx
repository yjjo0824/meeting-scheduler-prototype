import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatAttendSummary, formatUnmetConditions } from '../../presentation/candidateCopy'
import { formatSlotLabel, formatSlotsRangeLabel } from '../../presentation/dateDisplay'
import { AskSpecificallyEntry } from './AskSpecificallyEntry'
import { SlotPicker } from './SlotPicker'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  people: Person[]
  recommended: boolean
  tentative: boolean
  selected: boolean
  selectedSlot: Slot
  showFreeModeExtras: boolean
  // roving tabindex(라디오그룹 표준 패턴): 선택된 카드만 0, 나머지는 -1 — Tab은 그룹 전체에서
  // 선택된 항목 하나만 진입점으로 삼는다. 방향키 이동은 부모(TradeoffCandidates)가 처리한다.
  radioTabIndex: number
  radioRef: (el: HTMLButtonElement | null) => void
  onSelect: () => void
  onSelectSlot: (slot: Slot) => void
}

// 카드 = 비교 + 선택 전용(확정 CTA는 화면 하단에 하나만 있다 — TradeoffCandidates).
// 읽기 순서(위→아래): ① 추천/다른 안 ② 대표 시간 ③ 참석 인원 ④ 반영하지 못한 조건
// ⑤ 같은 조건의 다른 시간 선택. 접힌 대안도 ①~④는 항상 보여 비교가 가능하다.
// 선택 상태는 role="radio" + aria-checked로 시각 표시(테두리·라디오 점)와 항상 일치시킨다.
// cost 숫자는 어디에도 읽지 않는다(SPEC §4.3).
export function CandidateGroupCard({
  group,
  people,
  recommended,
  tentative,
  selected,
  selectedSlot,
  showFreeModeExtras,
  radioTabIndex,
  radioRef,
  onSelect,
  onSelectSlot,
}: Props) {
  // 펼침은 선택에서 파생한다(별도 로컬 상태 없음) — 클릭이든 방향키든 "선택됨"은 항상 "펼쳐짐"과
  // 같은 뜻이라, 방향키로 옮겨도 부모가 selected만 갱신하면 펼침이 자동으로 따라온다.
  const open = recommended || selected
  const contentId = `candidate-content-${group.key}`

  // 대표 시간: 펼친 카드는 지금 선택된 슬롯, 접힌 카드는 그룹 전체 범위("수요일 오후 2–5시")로
  // 접어 보여준다 — 접힌 상태에서도 어떤 시간대의 안인지 비교할 수 있어야 한다.
  const headline = open ? formatSlotLabel(selectedSlot) : formatSlotsRangeLabel(group.slots)

  return (
    // 선택 표현은 이 컨테이너 한 겹으로만 그린다. 라디오 버튼 자체의 focus-visible outline은
    // 없앴다(아래) — 방향키 이동 시 버튼 자체 테두리(헤더 영역)와 카드 외곽 테두리가 이중으로
    // 겹쳐 보이는 문제가 있었다(12B-3 QA). focus-within으로 "지금 실제로 키보드 포커스가 이
    // 카드 안에 있다"는 상태만 살짝 더 강조해, selected와 focus가 항상 함께 성립하는 roving
    // tabindex 특성상 하나의 링만 항상 보이면서도 순수 마우스 선택과 키보드 포커스를 구분한다.
    <div
      className={`rounded-xl border p-4 transition-shadow focus-within:ring-2 focus-within:ring-slate-900 ${
        selected ? 'border-slate-900 shadow-sm ring-1 ring-slate-900' : 'border-slate-200'
      }`}
    >
      <button
        ref={radioRef}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-expanded={open}
        aria-controls={contentId}
        tabIndex={radioTabIndex}
        onClick={onSelect}
        className="flex w-full items-start gap-3 text-left outline-none"
      >
        {/* 시각적 라디오 표시 — aria-checked와 항상 같은 값을 그린다. */}
        <span
          aria-hidden="true"
          className={`mt-1 inline-block h-4 w-4 shrink-0 rounded-full border-2 ${
            selected ? 'border-slate-900 bg-slate-900 shadow-[inset_0_0_0_3px_white]' : 'border-slate-300 bg-white'
          }`}
        />
        <span className="space-y-1">
          <span className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                recommended ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {recommended ? '추천' : '다른 안'}
            </span>
            {tentative && <TentativeBadge />}
          </span>
          <span className="block text-lg font-semibold text-slate-900">{headline}</span>
          <span className="block text-sm font-medium text-slate-700">{formatAttendSummary(group)}</span>
          <span className="block text-xs text-slate-500">{formatUnmetConditions(group, people)}</span>
        </span>
      </button>

      {open ? (
        <div id={contentId} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          {/* 시간 버튼은 라디오그룹의 roving tabindex와 별개로 일반 Tab 순서를 그대로 따른다. */}
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
          {showFreeModeExtras && <AskSpecificallyEntry />}
        </div>
      ) : (
        // 접힌 카드의 내용(시간 목록 등)은 아예 렌더되지 않으므로 키보드 탐색 순서에도 없다.
        <button
          type="button"
          onClick={onSelect}
          className="ml-7 mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
        >
          시간 선택하기
        </button>
      )}
    </div>
  )
}
