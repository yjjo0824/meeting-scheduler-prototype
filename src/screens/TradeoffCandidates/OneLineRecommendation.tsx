import type { CandidateGroup, Slot } from '../../types/engine'
import { formatSlotLabel } from '../../presentation/dateDisplay'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  tentative: boolean
  onBack: () => void
  onConfirm: (slot: Slot) => void
}

// R2 한 줄 모드: 완벽 슬롯이 존재하면 그것은 "포기 0건 후보군" 하나다 — 별도 코드 경로가 아니라
// 같은 그룹 객체를 특수 렌더링하는 것뿐이다.
export function OneLineRecommendation({ group, tentative, onBack, onConfirm }: Props) {
  const slot = group.defaultSlot
  const otherSlotsCount = group.slots.length - 1

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8">
      {/* tradeoff-screen 대상 바깥(형제)에 둔다 — 투어 중에는 다른 비대상 요소처럼 inert
          처리되어, 눌러도 투어 상태를 깨지 않는다(TradeoffCandidates.tsx와 동일한 이유, 12B-4 QA). */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        ← 응답 현황으로
      </button>

      <div className="relative space-y-3" data-tour-id="tradeoff-screen">
        {tentative && <TentativeBadge />}
        <p className="text-base text-slate-900">
          모두 괜찮은 시간이 있어요. {formatSlotLabel(slot)}, 확정할까요?
          {otherSlotsCount > 0 && <span className="text-slate-400"> (다른 시간 {otherSlotsCount}개)</span>}
        </p>
        <button
          type="button"
          onClick={() => onConfirm(slot)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {formatSlotLabel(slot)}로 확정하기
        </button>
      </div>
    </div>
  )
}
