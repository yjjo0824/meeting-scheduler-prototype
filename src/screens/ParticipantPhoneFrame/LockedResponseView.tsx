import { useState } from 'react'
import { buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import { formatSlotTimeRange } from '../../presentation/dateDisplay'
import { Button } from '../../shared/Button'
import type { Person } from '../../types/domain'
import type { Slot } from '../../types/engine'

interface Props {
  person: Person
  slot: Slot
  organizerName: string
  reported: boolean
  onReport: () => void
}

// R8 잠금 상태: 확정 결과(사람이 궁금한 것)를 시스템 상태 설명보다 먼저 보여준다. 12D-1의
// 섹션 패턴을 입력 화면과 같은 위계로 쓴다 — 확정 시간이 이 화면의 강조 정보다.
// 확정 표기는 요일 체계("금요일 오후 1:00–2:00", 12C-12.3)로 다른 확정 표기와 통일한다.
export function LockedResponseView({ person, slot, organizerName, reported, onReport }: Props) {
  const [justReported, setJustReported] = useState(false)
  const groups = groupConditionsByDay(buildConditionSummary([person]))

  return (
    <div className="py-4">
      <div className="space-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink-900">회의 시간이 정해졌어요</h3>
        <p className="text-xl font-extrabold tracking-tight text-brand-600">{formatSlotTimeRange(slot)}</p>
        <p className="text-xs text-ink-500">이제 응답은 수정할 수 없어요.</p>
      </div>

      <section className="space-y-1 pt-5">
        <h3 className="text-lg font-bold tracking-tight text-ink-900">전달한 시간 조건</h3>
        <div className="mt-2 space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.day} className="rounded-chip bg-surface-muted p-3 text-xs text-ink-700">
                <p className="text-sm font-bold text-ink-900">{group.day === '매일' ? '매일' : `${group.day}요일`}</p>
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.key}>
                      {formatHourRange(item.hours)} · {item.typeLabel}
                      {item.cue && <span className="text-ink-500"> · {item.cue}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-xs text-ink-500">추가 조건 없이 캘린더 일정만 반영했어요</p>
          )}
        </div>
      </section>

      <div className="space-y-2 pt-4">
        {/* 잠금 상태 다이얼로그의 최초 포커스 대상(12C-12.6 — 닫기 버튼 제거 후 이 화면의 유일한
            행동). 신고를 이미 보내 disabled면 getInitialFocus가 건너뛰고 패널로 폴백한다. */}
        <Button
          variant="secondary"
          size="sm"
          disabled={reported}
          data-phone-focus-target="true"
          onClick={() => {
            onReport()
            setJustReported(true)
          }}
        >
          이 시간에 참석하기 어려워졌어요
        </Button>
        {(reported || justReported) && (
          <p className="text-xs text-brand-600">
            {organizerName} 님에게 알렸어요. 다시 조율할지는 주최자가 결정해요.
          </p>
        )}
      </div>
    </div>
  )
}
