import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets, type ConditionSets } from '../../engine/conditionSets'
import { slotKey } from '../../engine/slotKey'
import { classifySlot, type SlotState } from '../../presentation/conditionMap'
import { attendanceLabel } from '../../presentation/conditionCopy'
import { deriveEffectivePeople } from '../../state/useSchedule'
import type { Day, Grid, Person } from '../../types/domain'
import { Badge } from '../../shared/Badge'
import { MapLegend } from './MapLegend'

interface Props {
  people: Person[]
  hasResponded: Record<string, boolean>
  selectedPersonId: string | null
  onSelectPerson: (personId: string) => void
  // 확정 후 "참석하기 어려워졌어요" 신고자 표시용 — 확정이 풀리면 호출부가 빈 객체를 넘긴다.
  reportedByPersonId?: Record<string, boolean>
}

const SLOT_STYLE: Record<SlotState, string> = {
  hard: 'border-ink-700 bg-ink-700',
  avoid: 'border-warn-600 bg-warn-50',
  flexible: 'border-2 border-success-600 bg-success-50',
  available: 'border-border bg-surface',
}

const SLOT_LABEL: Record<SlotState, string> = {
  hard: '참석 어려움',
  avoid: '가급적 피함',
  flexible: '옮길 수 있음',
  available: '참석 가능',
}

interface RowProps {
  people: Person[]
  hasResponded: Record<string, boolean>
  selectedPersonId: string | null
  onSelectPerson: (personId: string) => void
  reportedByPersonId: Record<string, boolean>
}

// whitespace-nowrap: 이름 열 폭이 좁아져도 이름이 세로로 꺾이지 않는다 — 대신 표 전체가
// 컨테이너의 overflow-x-auto로 가로 스크롤된다(페이지 전체 스크롤은 생기지 않는다).
// export: 모바일 요일별 비교 그리드(MobileDayCompareGrid)가 같은 셀을 그대로 재사용한다 —
// 렌더링·분류 로직을 두 번째로 베끼지 않는다.
export function PersonNameCell({
  person,
  responded,
  onSelectPerson,
  reported = false,
}: {
  person: Person
  responded: boolean
  onSelectPerson: (personId: string) => void
  reported?: boolean
}) {
  return (
    <td className="pr-2 align-middle">
      <button
        type="button"
        onClick={() => onSelectPerson(person.id)}
        className="w-full whitespace-nowrap rounded px-2 py-1.5 text-left"
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-ink-900">
          {person.name}
          <Badge tone="neutral">{attendanceLabel(person.attendance)}</Badge>
          {!responded && <Badge tone="warn">답변 전</Badge>}
          {reported && <Badge tone="danger">참석 어려움 알림</Badge>}
        </div>
        <p className="mt-0.5 whitespace-nowrap text-xs text-ink-500">{person.job}</p>
      </button>
    </td>
  )
}

// R7: 응답 전 사람은 캘린더만 알려진 상태(응답 칩은 아직 미반영)로 지도를 그린다.
// R4: 지도 셀은 시간·성격만 나타내고 일정 제목·사유는 어디에도 담지 않는다.
// aspect-square로 너비=높이를 강제해 모든 시간 셀의 크기가 동일하게 유지된다.
// 셀 사이 간격은 border-spacing이 아니라 td 자체의 p-0.5로 만든다 — 분리 보더 모델에서
// border-spacing의 틈에는 행 배경(tr)이 칠해지지 않아, 선택된 행의 배경이 셀마다 끊긴
// 줄무늬로 보이는 문제가 있었다(12C-6). 셀이 서로 맞닿고 간격이 셀 내부 여백이 되면
// 행 배경이 이름 영역부터 마지막 슬롯까지 끊김 없이 이어진다.
export function SlotCell({ person, day, hour, responded, sets }: { person: Person; day: Day; hour: number; responded: boolean; sets: ConditionSets }) {
  const key = slotKey(day, hour)
  const state = classifySlot(person.id, key, sets)
  const isUnknown = !responded && state === 'available'
  const label = isUnknown ? '답변 전 · 현재 참석 가능으로 계산' : SLOT_LABEL[state]
  return (
    <td className="p-0.5 align-middle">
      <span
        className={`block aspect-square min-w-[12px] rounded border ${SLOT_STYLE[state]} ${
          isUnknown ? 'border-dashed' : ''
        }`}
        title={`${person.name} · ${day}요일 ${hour}시 · ${label}`}
      />
    </td>
  )
}

// 월~금 40슬롯을 하나의 표로 통합해 보여준다 — 768px 이상 모든 폭에서 공통으로 쓰는 유일한
// 조건 지도 렌더링 경로다(요일별 미니 지도로 쪼개지 않는다, 12A.8). 폭이 부족하면 부모의
// overflow-x-auto가 표 내부만 가로 스크롤시키고, 페이지 전체는 스크롤되지 않는다.
function FullWeekMap({ people, grid, sets, hasResponded, selectedPersonId, onSelectPerson, reportedByPersonId }: RowProps & { grid: Grid; sets: ConditionSets }) {
  return (
    // border-spacing-0: 셀 간격은 SlotCell의 p-0.5가 담당한다 — 선택된 행 배경(tr)이 틈 없이
    // 이어지게 하기 위함(위 SlotCell 주석 참조).
    <table className="w-full min-w-[760px] border-separate border-spacing-0">
      <thead>
        <tr>
          <th className="w-32" />
          {grid.days.map((day) => (
            <th key={day} colSpan={grid.hours.length} className="pb-1 text-center text-xs font-bold text-ink-700">
              {day}요일
            </th>
          ))}
        </tr>
        <tr>
          <th />
          {grid.days.flatMap((day) =>
            grid.hours.map((hour) => (
              <th key={`${day}-${hour}-h`} className="pb-2 text-center text-[10px] font-normal text-ink-500">
                {hour}
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {people.map((person) => {
          const responded = hasResponded[person.id]
          const selected = person.id === selectedPersonId
          return (
            // 선택 배경은 tr(행 컨테이너) 한 번만 칠한다 — 셀 개별 배경 없이, 이름·직무 영역부터
            // 마지막 슬롯까지 연속된 한 장의 배경으로 보인다. 슬롯 상태 색은 그 위의 span이 그린다.
            <tr key={person.id} className={selected ? 'bg-state-selected-soft' : undefined}>
              <PersonNameCell
                person={person}
                responded={responded}
                onSelectPerson={onSelectPerson}
                reported={reportedByPersonId[person.id] ?? false}
              />
              {grid.days.flatMap((day) =>
                grid.hours.map((hour) => (
                  <SlotCell key={`${person.id}-${day}-${hour}`} person={person} day={day} hour={hour} responded={responded} sets={sets} />
                )),
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function ConditionMap({ people, hasResponded, selectedPersonId, onSelectPerson, reportedByPersonId = {} }: Props) {
  const grid = RAW_SEED.grid
  const effectivePeople = deriveEffectivePeople(people, hasResponded)
  const sets = buildConditionSets(effectivePeople, grid)

  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <h3 className="text-lg font-bold text-ink-900">모두의 시간 조건</h3>
          <p className="text-sm text-ink-700">참여자를 누르면 조건의 출처를 확인할 수 있어요.</p>
        </div>
        <MapLegend />
      </div>

      <div className="overflow-x-auto p-5">
        <FullWeekMap
          people={people}
          grid={grid}
          sets={sets}
          hasResponded={hasResponded}
          selectedPersonId={selectedPersonId}
          onSelectPerson={onSelectPerson}
          reportedByPersonId={reportedByPersonId}
        />
      </div>
    </div>
  )
}
