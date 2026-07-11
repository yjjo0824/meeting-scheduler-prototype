import { useState } from 'react'
import { RAW_SEED } from '../../data/loadSeed'
import { useAppState } from '../../state/AppContext'
import { Card } from '../../shared/Card'
import { ConditionMap } from './ConditionMap'
import { MeetingHeader } from './MeetingHeader'
import { PersonDetailPanel } from './PersonDetailPanel'
import { RecommendationCard } from './RecommendationCard'
import { RemindActionCard } from './RemindActionCard'

export function HostDashboard() {
  const { state, dispatch, schedule } = useAppState()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const pendingPerson = state.people.find((p) => !state.hasResponded[p.id]) ?? null
  const respondedCount = state.people.filter((p) => state.hasResponded[p.id]).length
  const selectedPerson = state.people.find((p) => p.id === selectedPersonId) ?? null

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <MeetingHeader meeting={RAW_SEED.meeting} respondedCount={respondedCount} />

      {/* 미응답 상태(리마인드)와 잠정 추천을 분리된 카드로 나란히 둔다 — 요청 흐름과 추천 정보를
          한 문구에 섞지 않는다. */}
      <div className={`grid gap-4 ${pendingPerson ? 'md:grid-cols-2' : ''}`}>
        {pendingPerson && (
          <RemindActionCard
            pendingPersonName={pendingPerson.name}
            respondedCount={respondedCount}
            total={state.people.length}
            onClick={() => dispatch({ type: 'OPEN_PHONE_FRAME', personId: pendingPerson.id })}
          />
        )}
        {/* 조건이 바뀌면(정정·칩 편집·필수/선택 변경) schedule은 매 렌더마다 다시 계산되므로
            이 카드의 내용이 곧 재계산 피드백이다 — 별도 토스트 없이 항상 최신 상태를 보여준다. */}
        <RecommendationCard schedule={schedule} people={state.people} hasResponded={state.hasResponded} />
      </div>

      {/* 데스크톱 기본은 조건 지도 + 상세 패널 2열. 두 영역이 동시에 필요한 최소 폭(지도 760px +
          패널 300px + 여백)을 만족하는 xl(1280px) 이상에서만 나란히 두고, 그보다 좁으면(중간 화면)
          상세 패널이 지도 아래로 내려가 겹침·잘림 없이 세로로 쌓인다. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <ConditionMap
          people={state.people}
          hasResponded={state.hasResponded}
          selectedPersonId={selectedPersonId}
          onSelectPerson={(personId) => setSelectedPersonId((prev) => (prev === personId ? null : personId))}
        />
        {selectedPerson ? (
          <PersonDetailPanel
            person={selectedPerson}
            responded={state.hasResponded[selectedPerson.id]}
            onChangeAttendance={(attendance) =>
              dispatch({ type: 'SET_ATTENDANCE', personId: selectedPerson.id, attendance })
            }
          />
        ) : (
          <Card className="flex items-center justify-center border border-dashed border-border text-center text-sm text-ink-700">
            참여자를 선택하면 조건 상세가 여기 보여요
          </Card>
        )}
      </div>
    </div>
  )
}
