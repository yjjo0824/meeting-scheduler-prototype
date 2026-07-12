import type { Chip } from '../../types/domain'
import { ChipItem } from './ChipItem'
import { PhoneEmptyNotice } from './PhoneEmptyNotice'

interface Props {
  chips: Chip[]
  // 칩의 출처(기존 응답/현재 자연어)에 따라 수정이 서로 다른 draft 레이어로 가야 하므로,
  // 목록 전체를 되돌려주는 대신 어느 칩에 어떤 조작이 일어났는지(index)만 알린다 —
  // 라우팅과 조건 변경 바텀시트는 단일 draft를 관리하는 ParticipantPhoneFrame의 책임이다.
  onRequestChange: (index: number) => void
  onDelete: (index: number) => void
}

export function ChipReviewList({ chips, onRequestChange, onDelete }: Props) {
  return (
    <section className="py-4">
      <h3 className="text-lg font-bold tracking-tight text-ink-900">이렇게 이해했어요</h3>
      <p className="mt-heading-gap text-xs text-ink-500">다른 내용은 눌러서 고쳐주세요.</p>
      {/* 빈 상태(12C-12.7): 보조 문구(설명)와 구분되도록 캘린더 빈 상태와 동일한 회색 박스로
          현재 상태를 보여준다 — 칩이 1개 이상이면 박스 대신 기존 칩 목록만 노출된다. */}
      {chips.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {chips.map((chip, index) => (
            <ChipItem
              key={`${chip.type}-${chip.day}-${chip.hours.join('_')}-${index}`}
              chip={chip}
              onRequestChange={() => onRequestChange(index)}
              onDelete={() => onDelete(index)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2">
          <PhoneEmptyNotice>아직 추가한 조건이 없어요</PhoneEmptyNotice>
        </div>
      )}
    </section>
  )
}
