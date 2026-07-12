import type { Chip } from '../../types/domain'
import { ChipItem } from './ChipItem'

interface Props {
  chips: Chip[]
  // 칩의 출처(기존 응답/현재 자연어)에 따라 수정이 서로 다른 draft 레이어로 가야 하므로,
  // 목록 전체를 되돌려주는 대신 어느 칩에 어떤 조작이 일어났는지(index)만 알린다 —
  // 라우팅은 단일 draft를 관리하는 ParticipantPhoneFrame의 책임이다.
  onToggleType: (index: number) => void
  onDelete: (index: number) => void
}

export function ChipReviewList({ chips, onToggleType, onDelete }: Props) {
  return (
    <section className="py-4">
      <h3 className="text-lg font-bold tracking-tight text-ink-900">이렇게 이해했어요</h3>
      <p className="mt-heading-gap text-xs text-ink-500">다른 내용은 눌러서 고쳐주세요.</p>
      <div className="mt-2 grid gap-2">
        {chips.map((chip, index) => (
          <ChipItem
            key={`${chip.type}-${chip.day}-${chip.hours.join('_')}-${index}`}
            chip={chip}
            onToggleType={() => onToggleType(index)}
            onDelete={() => onDelete(index)}
          />
        ))}
        {chips.length === 0 && <p className="text-xs text-ink-500">아직 추가한 조건이 없어요</p>}
      </div>
    </section>
  )
}
