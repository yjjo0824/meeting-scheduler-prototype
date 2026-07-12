import { buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import { Badge } from '../../shared/Badge'
import { Button } from '../../shared/Button'
import type { Person } from '../../types/domain'

interface Props {
  person: Person
  onEdit: () => void
  // 다시 조율 상태(주최자의 "다시 조율하기" 이후): 별도 화면·전역 상태 없이 이 완료 화면을
  // 재사용하되, 이전 조건을 다시 확인시키고 "그대로 보내기"를 주 행동으로 둔다.
  rescheduling?: boolean
  onResubmit?: () => void
}

// IMPLEMENTATION_SPEC §5 "제출 완료" 상태: 요약 + 수정 진입점. 12D-1의 섹션 패턴(상태 제목 →
// 보조 설명 → "전달한 시간 조건" 섹션의 요일별 카드)을 입력 화면과 같은 위계로 쓴다.
// 본인 화면이므로 캘린더 기반 조건까지 합쳐 "지금 실제로 적용 중인" 조건 전체를 보여준다 —
// R4상 본인은 원문·사유까지 전부 볼 수 있어 cue도 노출하고, 출처(캘린더/직접 입력)도 구분한다.
export function SubmittedSummaryView({ person, onEdit, rescheduling = false, onResubmit }: Props) {
  const groups = groupConditionsByDay(buildConditionSummary([person]))

  return (
    <div className="py-4">
      {rescheduling ? (
        <div>
          <Badge tone="warn">다시 조율 중</Badge>
          <h3 className="mt-1.5 text-lg font-bold tracking-tight text-ink-900">이전에 보낸 조건을 다시 확인해주세요</h3>
          <p className="mt-heading-gap text-xs text-ink-500">바뀐 내용만 수정하면 돼요.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold tracking-tight text-ink-900">응답을 보냈어요</h3>
          <p className="mt-heading-gap text-xs text-ink-500">회의가 확정되기 전까지 언제든 바꿀 수 있어요.</p>
        </div>
      )}

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
                      <span className="ml-1 text-ink-500">
                        · {item.source === '캘린더' ? '캘린더 일정' : '직접 알려줌'}
                      </span>
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

      <div className="flex flex-wrap items-center gap-2 pt-4">
        {rescheduling && onResubmit && (
          <Button size="sm" onClick={onResubmit}>
            이 조건 그대로 보내기
          </Button>
        )}
        {/* 다이얼로그가 이 상태로 열릴 때(제출 완료) 최초 포커스가 여기로 온다. */}
        <Button variant="secondary" size="sm" onClick={onEdit} data-phone-focus-target="true">
          응답 수정하기
        </Button>
      </div>
    </div>
  )
}
