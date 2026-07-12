import type { Person } from '../types/domain'

interface Props {
  people: Person[]
  onSelect: (personId: string) => void
}

// 평가자가 참여자 관점을 체험하는 진입점 — 실제 제품 화면(HostDashboard)에는 없다.
// "주최자가 남의 응답 화면을 대신 연다"는 실제 기능처럼 보이지 않도록, 이 진입점은
// 체험 도구 레이어에만 둔다(제품 UI와 체험 레이어의 구조적 분리). 평가용이라는 안내는
// FreeModeControls의 패널 헤더가 이미 한 번 말하므로 여기서 다시 반복하지 않는다.
// 주최자(is_organizer — 지원)는 제외한다: 응답 플로우(참여자 화면)가 없는 사람이라
// 체험 대상은 나머지 5명이다(seed 참조).
export function ParticipantExperienceEntry({ people, onSelect }: Props) {
  return (
    <div className="space-y-1.5 border-t border-border pt-3">
      <p className="text-xs font-bold text-ink-900">참여자로 체험하기</p>
      <div className="flex flex-wrap gap-1.5">
        {people
          .filter((person) => !person.is_organizer)
          .map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person.id)}
              className="rounded-pill border border-border px-2.5 py-1 text-xs text-ink-700 hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {person.name}
            </button>
          ))}
      </div>
    </div>
  )
}
