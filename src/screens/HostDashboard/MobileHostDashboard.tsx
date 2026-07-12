import { RAW_SEED } from '../../data/loadSeed'
import { buildConditionSets } from '../../engine/conditionSets'
import { useAppState } from '../../state/AppContext'
import { deriveEffectivePeople } from '../../state/useSchedule'
import type { Day } from '../../types/domain'
import { Button } from '../../shared/Button'
import { MapLegend } from './MapLegend'
import { MeetingHeader } from './MeetingHeader'
import { MobileDayCompareGrid } from './MobileDayCompareGrid'
import { MobileDayTabs } from './MobileDayTabs'
import { MobileParticipantList } from './MobileParticipantList'
import { PersonDetailPanel } from './PersonDetailPanel'
import { RecommendationCard } from './RecommendationCard'
import { RemindActionCard } from './RemindActionCard'
import { ReportNoticeCard } from './ReportNoticeCard'

export type MobileView = 'list' | 'detail' | 'days'

interface Props {
  selectedPersonId: string | null
  onSelectPerson: (personId: string | null) => void
  view: MobileView
  onChangeView: (view: MobileView) => void
  selectedDay: Day
  onSelectDay: (day: Day) => void
}

// 좁은 뷰포트에서 HostDashboard가 조기 반환하는 실제 제품 화면(모바일 주최자 뷰) — 데스크톱
// 40슬롯 통합 지도를 축소하지 않고, list(참여자 목록) / detail(참여자 상세, PersonDetailPanel
// 재사용) / days(요일 탭 + 하루치 6명×8슬롯) 세 로컬 뷰만 전환한다. 전역 screen은 여전히
// 'host' 그대로이고, 새 전역 액션은 쓰지 않는다.
//
// view/selectedDay 상태는 여기가 아니라 부모(HostDashboard — 브레이크포인트가 바뀌어도
// 언마운트되지 않는 레벨)가 소유한다(12C-7): 이 컴포넌트는 뷰포트가 데스크톱 폭으로 넓어지면
// 언마운트되므로, 로컬 상태로 두면 days를 보다가 데스크톱을 거쳐 돌아왔을 때 list로 초기화되는
// 버그가 있었다. selectedPersonId를 부모가 소유하는 것과 같은 이유·같은 패턴이다.
//
// 다른 참여자의 응답 화면(ParticipantPhoneFrame)을 여는 CTA는 여기 어디에도 없다 — 리마인드는
// "미응답 중인 그 한 사람"에게만, 기존 데스크톱과 동일한 OPEN_PHONE_FRAME 재사용이다. 자유 모드
// 참여자 체험 진입점(ParticipantExperienceEntry)은 이 컴포넌트 밖(App.tsx 레벨의
// FreeModeControls)에만 있다.
export function MobileHostDashboard({
  selectedPersonId,
  onSelectPerson,
  view,
  onChangeView,
  selectedDay,
  onSelectDay,
}: Props) {
  const { state, dispatch, schedule } = useAppState()

  const pendingPerson = state.people.find((p) => !state.hasResponded[p.id]) ?? null
  const respondedCount = state.people.filter((p) => state.hasResponded[p.id]).length
  const selectedPerson = state.people.find((p) => p.id === selectedPersonId) ?? null

  function openDetail(personId: string) {
    onSelectPerson(personId)
    onChangeView('detail')
  }

  function backToList() {
    onChangeView('list')
  }

  if (view === 'detail' && selectedPerson) {
    return (
      <div className="mx-auto max-w-[520px] space-y-4 p-4">
        <button type="button" onClick={backToList} className="text-sm font-medium text-ink-700">
          ← 목록으로
        </button>
        <PersonDetailPanel
          person={selectedPerson}
          responded={state.hasResponded[selectedPerson.id]}
          reported={state.confirmedMeeting !== null && (state.reportedByPersonId[selectedPerson.id] ?? false)}
          onChangeAttendance={(attendance) =>
            dispatch({ type: 'SET_ATTENDANCE', personId: selectedPerson.id, attendance })
          }
        />
      </div>
    )
  }

  if (view === 'days') {
    const effective = deriveEffectivePeople(state.people, state.hasResponded)
    const sets = buildConditionSets(effective, RAW_SEED.grid)
    return (
      <div className="mx-auto max-w-[520px] space-y-4 p-4">
        <button type="button" onClick={backToList} className="text-sm font-medium text-ink-700">
          ← 목록으로
        </button>
        <h2 className="text-lg font-bold text-ink-900">요일별 시간 보기</h2>
        <MobileDayTabs days={RAW_SEED.grid.days} selectedDay={selectedDay} onSelectDay={onSelectDay} />
        <MobileDayCompareGrid
          day={selectedDay}
          hours={RAW_SEED.grid.hours}
          people={state.people}
          hasResponded={state.hasResponded}
          sets={sets}
          onSelectPerson={openDetail}
        />
        <MapLegend />
      </div>
    )
  }

  const reporters = state.confirmedMeeting
    ? state.people.filter((p) => state.reportedByPersonId[p.id])
    : []

  return (
    <div className="mx-auto max-w-[520px] space-y-4 p-4">
      <MeetingHeader meeting={RAW_SEED.meeting} respondedCount={respondedCount} />

      <ReportNoticeCard
        reporters={reporters}
        onOpenConfirmation={() => dispatch({ type: 'NAVIGATE', screen: 'confirmation' })}
      />

      {pendingPerson && (
        <RemindActionCard
          pendingPersonName={pendingPerson.name}
          respondedCount={respondedCount}
          total={state.people.length}
          onClick={() => dispatch({ type: 'OPEN_PHONE_FRAME', personId: pendingPerson.id })}
        />
      )}

      <RecommendationCard schedule={schedule} people={state.people} hasResponded={state.hasResponded} />

      <MobileParticipantList
        people={state.people}
        hasResponded={state.hasResponded}
        onSelectPerson={openDetail}
        reportedByPersonId={state.confirmedMeeting ? state.reportedByPersonId : {}}
      />

      {/* 후보 비교가 주 행동(primary), 요일별 시간은 보조 탐색(secondary). */}
      <Button variant="secondary" onClick={() => onChangeView('days')} className="w-full">
        요일별 시간 보기
      </Button>

      {state.confirmedMeeting ? (
        <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'confirmation' })} className="w-full">
          확정 결과 보기
        </Button>
      ) : (
        <Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'tradeoff' })} className="w-full">
          후보 시간 비교하기
        </Button>
      )}
    </div>
  )
}
