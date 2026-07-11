import type { Person } from '../types/domain'

interface Props {
  people: Person[]
  onSelect: (personId: string) => void
}

// 평가자가 참여자 관점을 체험하는 진입점 — 실제 제품 화면(HostDashboard)에는 없다.
// "주최자가 남의 응답 화면을 대신 연다"는 실제 기능처럼 보이지 않도록, 이 진입점은
// 자유 모드 체험 레이어에만 둔다(제품 UI와 체험 레이어의 구조적 분리).
export function ParticipantExperienceEntry({ people, onSelect }: Props) {
  return (
    <div className="space-y-1.5 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold text-slate-900">참여자로 체험하기</p>
      <p className="text-[11px] text-slate-400">평가용 기능이에요 — 실제 제품에는 없어요.</p>
      <div className="flex flex-wrap gap-1.5">
        {people.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => onSelect(person.id)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600"
          >
            {person.name}
          </button>
        ))}
      </div>
    </div>
  )
}
