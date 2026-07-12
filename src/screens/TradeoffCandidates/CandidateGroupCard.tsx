import { RAW_SEED } from '../../data/loadSeed'
import type { Person } from '../../types/domain'
import type { CandidateGroup, Slot } from '../../types/engine'
import { formatAttendCount, formatConsiderations, formatPositiveLine } from '../../presentation/candidateCopy'
import { formatSlotWithDate } from '../../presentation/dateDisplay'
import { Badge } from '../../shared/Badge'
import { SlotPicker } from './SlotPicker'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  people: Person[]
  recommended: boolean
  tentative: boolean
  selected: boolean
  selectedSlot: Slot
  // roving tabindex(라디오그룹 표준 패턴): 선택된 카드만 0, 나머지는 -1 — Tab은 그룹 전체에서
  // 선택된 항목 하나만 진입점으로 삼는다. 방향키 이동은 부모(TradeoffCandidates)가 처리한다.
  radioTabIndex: number
  radioRef: (el: HTMLButtonElement | null) => void
  onSelect: () => void
  onSelectSlot: (slot: Slot) => void
}

// 카드 = 비교 + 선택 전용(확정 CTA는 화면 하단에 하나만 있다 — TradeoffCandidates).
// 내부 구조(12C-12, 위→아래): ① 배지 + 날짜 포함 제목 ② 플랫 정보 줄(긍정 정보 + 참석 n/m,
// 시각 강조 없이 나란히) ③ 시간 선택(선택된 카드 + 시간 2개 이상일 때만 — 12C-8 점진 노출)
// ④ 구분선 아래 "고려할 점" 강조 블록(surface-muted, 포기 내용·주체 명시 — R2).
// 모든 뷰포트에서 세로 카드 스택이다(12C-9 가로 행은 12C-12에서 되돌림 — 스크롤 문제는 하단
// 플로팅 CTA가 대신 해결한다). cost 숫자는 어디에도 읽지 않는다(SPEC §4.3).
export function CandidateGroupCard({
  group,
  people,
  recommended,
  tentative,
  selected,
  selectedSlot,
  radioTabIndex,
  radioRef,
  onSelect,
  onSelectSlot,
}: Props) {
  const contentId = `candidate-content-${group.key}`
  const display = RAW_SEED.schedule_display
  // 시간 선택 블록은 선택된 카드 + 시간이 2개 이상일 때만 열린다(1개면 제목이 이미 그 시간이다).
  const hasTimeBlock = selected && group.slots.length > 1

  // 제목: 선택된 카드는 지금 선택된 시간(날짜 포함), 비선택 카드는 대표 시간 + 나머지 개수로
  // 축약한다("7월 15일 수요일 오후 2시 외 3개") — 비선택 상태에서도 어떤 안인지 비교할 수 있게.
  const title = selected
    ? formatSlotWithDate(selectedSlot, display)
    : group.slots.length > 1
      ? `${formatSlotWithDate(group.defaultSlot, display)} 외 ${group.slots.length - 1}개`
      : formatSlotWithDate(group.defaultSlot, display)

  const considerations = formatConsiderations(group, people)

  return (
    // 선택 표현은 이 컨테이너 한 겹(테두리+링+틴트)으로만 그린다 — 라디오 버튼 자체의
    // focus-visible outline은 없애고(12B-3 QA) focus-within으로 대신한다. 카드 전체가 하나의
    // 선택 타깃이다(12C-8) — 헤더의 role="radio" 버튼이 키보드·보조기기 의미를 담당하고,
    // 컨테이너 클릭은 마우스용 넓은 히트 영역이다.
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
        aria-expanded={hasTimeBlock}
        aria-controls={group.slots.length > 1 ? contentId : undefined}
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
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="flex items-center gap-2">
            <Badge tone={recommended ? 'brand' : 'neutral'}>{recommended ? '추천' : '다른 안'}</Badge>
            {tentative && <TentativeBadge />}
          </span>
          <span className="block text-lg font-bold text-ink-900">{title}</span>
          {/* 플랫 정보 줄 — 긍정 정보와 참석 집계를 시각적 강조 없이 나란히 둔다. */}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-700">
            <span>{formatPositiveLine(group)}</span>
            <span aria-hidden="true" className="text-ink-500">
              ·
            </span>
            <span className="text-ink-500">{formatAttendCount(group)}</span>
          </span>
        </span>
      </button>

      {hasTimeBlock && (
        <div id={contentId} className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-bold text-ink-900">시간을 골라주세요</p>
          {/* 시간 버튼은 라디오그룹의 roving tabindex와 별개로 일반 Tab 순서를 그대로 따른다.
              칩에서 시간을 바꾸면 부모의 selectedSlot이 바뀌어 위 제목에 즉시 반영된다.
              "다시 물어보기" 진입점은 화면 레벨 보조 액션으로 승격됐다(12C-12 — 카드에는 없음). */}
          <SlotPicker slots={group.slots} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />
        </div>
      )}

      {considerations.length > 0 && (
        // 고려할 점 — 포기 내용을 은은하게 구분해 강조한다(surface-muted 기존 토큰, 색 신설 없음).
        <div className="mt-3 border-t border-border pt-3">
          <div className="rounded-chip bg-surface-muted px-3 py-2.5">
            <p className="text-xs font-bold text-ink-700">고려할 점</p>
            <p className="mt-0.5 text-xs text-ink-700">{considerations.join(' ')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
