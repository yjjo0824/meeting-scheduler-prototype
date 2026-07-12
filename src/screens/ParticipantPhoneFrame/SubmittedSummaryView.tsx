import { buildConditionSummary, formatHourRange, groupConditionsByDay } from '../../presentation/conditionCopy'
import type { Person } from '../../types/domain'

interface Props {
  person: Person
  onEdit: () => void
  // 다시 조율 상태(주최자의 "다시 조율하기" 이후): 별도 화면·전역 상태 없이 이 완료 화면을
  // 재사용하되, 이전 조건을 다시 확인시키고 "그대로 보내기"를 주 행동으로 둔다.
  rescheduling?: boolean
  onResubmit?: () => void
}

// IMPLEMENTATION_SPEC §5 "제출 완료" 상태: 요약 + 수정 진입점.
// 본인 화면이므로 캘린더 기반 조건까지 합쳐 "지금 실제로 적용 중인" 조건 전체를 보여준다 —
// R4상 본인은 원문·사유까지 전부 볼 수 있어 cue도 노출하고, 출처(캘린더/직접 입력)도 구분한다.
export function SubmittedSummaryView({ person, onEdit, rescheduling = false, onResubmit }: Props) {
  const groups = groupConditionsByDay(buildConditionSummary([person]))

  return (
    <div className="space-y-3 py-4 text-sm text-slate-600">
      {rescheduling ? (
        <>
          <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            다시 조율 중
          </span>
          <p className="text-base font-semibold text-slate-900">이전에 보낸 조건을 다시 확인해주세요</p>
          <p className="text-xs text-slate-500">바뀐 내용만 수정하면 돼요.</p>
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-slate-900">응답을 보냈어요</p>
          <p className="text-xs text-slate-500">회의가 확정되기 전까지 언제든 바꿀 수 있어요.</p>
        </>
      )}

      <p className="pt-1 text-xs font-semibold text-slate-700">전달한 시간 조건</p>
      {groups.length > 0 ? (
        <ul className="space-y-2 text-xs text-slate-500">
          {groups.map((group) => (
            <li key={group.day}>
              <p className="font-semibold text-slate-700">{group.day === '매일' ? '매일' : `${group.day}요일`}</p>
              <ul className="mt-0.5 space-y-0.5 pl-2">
                {group.items.map((item) => (
                  <li key={item.key}>
                    {formatHourRange(item.hours)} · {item.typeLabel}
                    <span className="ml-1 text-slate-400">
                      · {item.source === '캘린더' ? '캘린더 일정' : '직접 알려줌'}
                    </span>
                    {item.cue && <span className="text-slate-400"> · {item.cue}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">추가 조건 없이 캘린더 일정만 반영했어요</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {rescheduling && onResubmit && (
          <button
            type="button"
            onClick={onResubmit}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            이 조건 그대로 보내기
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
        >
          응답 수정하기
        </button>
      </div>
    </div>
  )
}
