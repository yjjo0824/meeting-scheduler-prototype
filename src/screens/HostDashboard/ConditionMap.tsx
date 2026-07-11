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
}

function PersonNameCell({ person, responded, onSelectPerson }: { person: Person; responded: boolean; onSelectPerson: (personId: string) => void }) {
  return (
    <td className="pr-2 align-middle">
      <button
        type="button"
        onClick={() => onSelectPerson(person.id)}
        className="w-full rounded px-2 py-1.5 text-left"
      >
        <div className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
          {person.name}
          <Badge tone="neutral">{attendanceLabel(person.attendance)}</Badge>
          {!responded && <Badge tone="warn">답변 전</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-ink-500">{person.job}</p>
      </button>
    </td>
  )
}

// R7: 응답 전 사람은 캘린더만 알려진 상태(응답 칩은 아직 미반영)로 지도를 그린다.
// R4: 지도 셀은 시간·성격만 나타내고 일정 제목·사유는 어디에도 담지 않는다.
// 데스크톱 전체 지도(xl)와 요일별 미니 지도(xl 미만)가 이 함수를 공유해 분류 로직이 두 곳에 갈라지지 않는다.
function SlotCell({ person, day, hour, responded, sets }: { person: Person; day: Day; hour: number; responded: boolean; sets: ConditionSets }) {
  const key = slotKey(day, hour)
  const state = classifySlot(person.id, key, sets)
  const isUnknown = !responded && state === 'available'
  const label = isUnknown ? '답변 전 · 현재 참석 가능으로 계산' : SLOT_LABEL[state]
  return (
    <td className="align-middle">
      <span
        className={`block aspect-square min-w-[12px] rounded border ${SLOT_STYLE[state]} ${
          isUnknown ? 'border-dashed' : ''
        }`}
        title={`${person.name} · ${day}요일 ${hour}시 · ${label}`}
      />
    </td>
  )
}

// 1280px 이상: 월~금 40슬롯을 하나의 표로 통합해 보여준다(기존 데스크톱 지도, 변경 없음).
function FullWeekMap({ people, grid, sets, hasResponded, selectedPersonId, onSelectPerson }: RowProps & { grid: Grid; sets: ConditionSets }) {
  return (
    <table className="w-full min-w-[760px] border-separate border-spacing-1">
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
            <tr key={person.id} className={selected ? 'bg-brand-50' : undefined}>
              <PersonNameCell person={person} responded={responded} onSelectPerson={onSelectPerson} />
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

// 768~1279px: 40슬롯 표를 가로 스크롤로 우겨넣는 대신, 요일별로 독립된 6명 × 8슬롯 미니 지도를
// 세로로 쌓는다 — 각 미니 지도 안에서는 참여자 행과 시간축 정렬이 그대로 유지된다(가로 스크롤 없음).
function DayMiniMap({ day, people, grid, sets, hasResponded, selectedPersonId, onSelectPerson }: RowProps & { day: Day; grid: Grid; sets: ConditionSets }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-sm font-bold text-ink-900">{day}요일</p>
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-20" />
            {grid.hours.map((hour) => (
              <th key={`${day}-${hour}-mini-h`} className="pb-1 text-center text-[10px] font-normal text-ink-500">
                {hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const responded = hasResponded[person.id]
            const selected = person.id === selectedPersonId
            return (
              <tr key={person.id} className={selected ? 'bg-brand-50' : undefined}>
                <PersonNameCell person={person} responded={responded} onSelectPerson={onSelectPerson} />
                {grid.hours.map((hour) => (
                  <SlotCell key={`${person.id}-${day}-${hour}`} person={person} day={day} hour={hour} responded={responded} sets={sets} />
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ConditionMap({ people, hasResponded, selectedPersonId, onSelectPerson }: Props) {
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

      <div className="hidden overflow-x-auto p-5 xl:block">
        <FullWeekMap
          people={people}
          grid={grid}
          sets={sets}
          hasResponded={hasResponded}
          selectedPersonId={selectedPersonId}
          onSelectPerson={onSelectPerson}
        />
      </div>

      <div className="space-y-4 p-5 xl:hidden">
        {grid.days.map((day) => (
          <DayMiniMap
            key={day}
            day={day}
            people={people}
            grid={grid}
            sets={sets}
            hasResponded={hasResponded}
            selectedPersonId={selectedPersonId}
            onSelectPerson={onSelectPerson}
          />
        ))}
      </div>
    </div>
  )
}
