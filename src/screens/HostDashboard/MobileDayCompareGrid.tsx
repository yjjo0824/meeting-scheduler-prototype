import type { ConditionSets } from '../../engine/conditionSets'
import type { Day, Person } from '../../types/domain'
import { PersonNameCell, SlotCell } from './ConditionMap'

interface Props {
  day: Day
  hours: number[]
  people: Person[]
  hasResponded: Record<string, boolean>
  sets: ConditionSets
  onSelectPerson: (personId: string) => void
}

// 선택한 요일 하루만 6명×8슬롯으로 보여준다 — 계산은 buildConditionSets/classifySlot을 그대로
// 재사용하고(호출부에서 sets를 만들어 넘김), 셀 렌더링도 ConditionMap의 SlotCell/PersonNameCell을
// 그대로 재사용한다(로직·마크업 중복 없음). 8개 열만 있어 데스크톱 40슬롯 표처럼 가로 스크롤이
// 필요하지 않다.
export function MobileDayCompareGrid({ day, hours, people, hasResponded, sets, onSelectPerson }: Props) {
  return (
    <div className="overflow-x-auto rounded-card bg-surface p-3 shadow-card">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-24" />
            {hours.map((hour) => (
              <th key={hour} className="pb-1 text-center text-[10px] font-normal text-ink-500">
                {hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const responded = hasResponded[person.id]
            return (
              <tr key={person.id}>
                <PersonNameCell person={person} responded={responded} onSelectPerson={onSelectPerson} />
                {hours.map((hour) => (
                  <SlotCell
                    key={`${person.id}-${day}-${hour}`}
                    person={person}
                    day={day}
                    hour={hour}
                    responded={responded}
                    sets={sets}
                  />
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
