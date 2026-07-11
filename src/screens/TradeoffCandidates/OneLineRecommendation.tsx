import type { CandidateGroup, Slot } from '../../types/engine'
import { TentativeBadge } from './TentativeBadge'

interface Props {
  group: CandidateGroup
  tentative: boolean
  onConfirm: (slot: Slot) => void
}

// R2 한 줄 모드: 완벽 슬롯이 존재하면 그것은 "포기 0건 후보군" 하나다 — 별도 코드 경로가 아니라
// 같은 그룹 객체를 특수 렌더링하는 것뿐이다.
export function OneLineRecommendation({ group, tentative, onConfirm }: Props) {
  const slot = group.defaultSlot
  const otherSlotsCount = group.slots.length - 1

  return (
    <div className="mx-auto max-w-xl space-y-3 p-8" data-tour-id="tradeoff-screen">
      {tentative && <TentativeBadge />}
      <p className="text-base text-slate-900">
        모두 괜찮은 시간이 있어요. {slot.day}요일 {slot.hour}시, 확정할까요?
        {otherSlotsCount > 0 && <span className="text-slate-400"> (다른 시간 {otherSlotsCount}개)</span>}
      </p>
      <button
        type="button"
        onClick={() => onConfirm(slot)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        확정할까요?
      </button>
    </div>
  )
}
