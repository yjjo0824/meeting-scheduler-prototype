import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatAttendSummary, formatUnmetConditions } from '../../presentation/candidateCopy'
import { formatSlotLabel, formatSlotsRangeLabel } from '../../presentation/dateDisplay'
import { Badge } from '../../shared/Badge'
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
// ⑤ 같은 조건의 다른 시간 선택. 선택되지 않은 카드도 ①~④는 항상 보여 비교가 가능하다.
// 선택 상태는 role="radio" + aria-checked로 시각 표시(테두리·라디오 점)와 항상 일치시킨다.
// cost 숫자는 어디에도 읽지 않는다(SPEC §4.3).
//
// 점진적 노출(12C-8): 시간 선택 칩(인터랙티브 UI)은 "선택된 카드"에만 렌더한다 — 비선택
// 카드에도 시간 버튼이 활성으로 보이면 카드(선택 타깃) 안에 또 버튼이 있는 중첩이 생긴다.
// 비선택 카드는 같은 자리에 일반 텍스트로 선택지를 예고만 한다(시간 1개면 제목에 이미 있어 생략).
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
  // 칩 노출은 선택에서만 파생한다(별도 로컬 상태 없음) — 클릭이든 방향키든 부모가 selected만
  // 갱신하면 칩 표시가 자동으로 따라온다. 추천 카드도 선택을 뺏기면 칩을 접는다.
  const open = selected
  const contentId = `candidate-content-${group.key}`

  // 대표 시간: 선택된 카드는 지금 선택된 슬롯, 비선택 카드는 그룹 전체 범위("수요일 오후
  // 2–5시")로 접어 보여준다 — 비선택 상태에서도 어떤 시간대의 안인지 비교할 수 있어야 한다.
  const headline = open ? formatSlotLabel(selectedSlot) : formatSlotsRangeLabel(group.slots)

  return (
    // 선택 표현은 이 컨테이너 한 겹으로만 그린다. 라디오 버튼 자체의 focus-visible outline은
    // 없앴다(아래) — 방향키 이동 시 버튼 자체 테두리(헤더 영역)와 카드 외곽 테두리가 이중으로
    // 겹쳐 보이는 문제가 있었다(12B-3 QA). focus-within으로 "지금 실제로 키보드 포커스가 이
    // 카드 안에 있다"는 상태만 살짝 더 강조해, selected와 focus가 항상 함께 성립하는 roving
    // tabindex 특성상 하나의 링만 항상 보이면서도 순수 마우스 선택과 키보드 포커스를 구분한다.
    // 카드 언어(rounded-card·bg-surface-card·shadow-card·p-card-pad)와 선택 색(state-selected)은
    // 전부 공통 토큰 — HostDashboard 카드와 같은 체계다.
    // 카드 전체가 하나의 선택 타깃이다(12C-8) — 헤더의 role="radio" 버튼이 키보드·보조기기
    // 의미를 담당하고, 이 컨테이너 클릭은 마우스 사용자를 위한 같은 행동의 넓은 히트 영역이다.
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-card border p-card-pad transition-shadow focus-within:ring-2 focus-within:ring-state-selected ${
        selected
          ? 'border-state-selected bg-state-selected-soft shadow-card ring-1 ring-state-selected'
          : 'border-border bg-surface-card shadow-card'
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
            selected
              ? 'border-state-selected bg-state-selected shadow-[inset_0_0_0_3px_white]'
              : 'border-border bg-surface'
          }`}
        />
        <span className="space-y-1">
          <span className="flex items-center gap-2">
            <Badge tone={recommended ? 'brand' : 'neutral'}>{recommended ? '추천' : '다른 안'}</Badge>
            {tentative && <TentativeBadge />}
          </span>
          <span className="block text-lg font-bold text-ink-900">{headline}</span>
          <span className="block text-sm font-medium text-ink-700">{formatAttendSummary(group)}</span>
          <span className="block text-xs text-ink-500">{formatUnmetConditions(group, people)}</span>
        </span>
      </button>

      {open ? (
        <div id={contentId} className="mt-3 space-y-3 border-t border-border pt-3">
          {/* 시간 버튼은 라디오그룹의 roving tabindex와 별개로 일반 Tab 순서를 그대로 따른다.
              칩에서 시간을 바꾸면 부모의 selectedSlot이 바뀌어 위 headline에 즉시 반영된다. */}
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
          {showFreeModeExtras && <AskSpecificallyEntry />}
        </div>
      ) : (
        // 비선택 카드: 인터랙티브 시간 UI를 아예 렌더하지 않는다(키보드 탐색 순서에도 없음) —
        // 시간이 2개 이상일 때만 일반 텍스트로 선택지를 예고한다(1개면 제목에 이미 있어 생략).
        group.slots.length > 1 && (
          <p className="ml-7 mt-3 border-t border-border pt-3 text-xs text-ink-500">
            {group.slots.map((slot) => `${slot.hour}시`).join(' · ')} 중 선택할 수 있어요
          </p>
        )
      )}
    </div>
  )
}
