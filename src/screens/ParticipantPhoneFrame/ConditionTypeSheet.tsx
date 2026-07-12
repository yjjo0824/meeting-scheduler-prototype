import { useRef } from 'react'
import type { Chip } from '../../types/domain'
import { useFocusTrap } from '../../shared/useFocusTrap'
import { useRestoreFocus } from '../../shared/useRestoreFocus'

type EditableType = Extract<Chip['type'], '불가' | '회피'>

interface Props {
  open: boolean
  timeLabel: string
  currentType: EditableType
  onSelect: (type: EditableType) => void
  onClose: () => void
}

// 선택지는 SPEC R3의 확실성 두 단계(불가↔회피)만 — 새 조건 종류를 추가하지 않는다.
const OPTIONS: { type: EditableType; label: string; description: string }[] = [
  { type: '불가', label: '참석 어려움', description: '이 시간에는 참석할 수 없어요' },
  { type: '회피', label: '가급적 피함', description: '가능하면 다른 시간을 원해요' },
]

// 조건 변경 바텀시트(폰 프레임 내부) — "조건 바꾸기"를 눌렀을 때 열리고, 선택지를 누르면
// 즉시 적용 + 닫힘(별도 저장 버튼 없음). 닫기 = 스크림 탭 또는 Esc(부모 keydown이 시트
// 우선으로 처리). 기존 dialog 패턴 재사용: useRestoreFocus(트리거 캡처)를 useFocusTrap보다
// 먼저 호출, 초기 포커스는 현재 선택된 옵션.
export function ConditionTypeSheet({ open, timeLabel, currentType, onSelect, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useRestoreFocus(open)
  useFocusTrap(sheetRef, open, () =>
    sheetRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ?? null,
  )

  if (!open) return null

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-black/30" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="condition-sheet-title"
        className="absolute inset-x-0 bottom-0 z-20 rounded-t-card border-t border-border bg-surface p-5 pb-6 shadow-elevated"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border" />
        <h3 id="condition-sheet-title" className="text-lg font-bold tracking-tight text-ink-900">
          이 시간을 어떻게 반영할까요?
        </h3>
        <p className="mt-heading-gap text-sm text-ink-500">{timeLabel}</p>

        <div role="radiogroup" aria-label="조건 종류" className="mt-4 space-y-2">
          {OPTIONS.map((option) => {
            const selected = option.type === currentType
            return (
              <button
                key={option.type}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  // 다른 조건 선택 = 즉시 적용 + 닫기. 같은 조건을 다시 눌러도 그냥 닫힌다.
                  onSelect(option.type)
                  onClose()
                }}
                className={`flex w-full items-center gap-3 rounded-chip border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
                  selected ? 'border-brand-500 bg-brand-50' : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                {/* 선택 상태는 색만이 아니라 라디오 점 + aria-checked로도 구분한다. */}
                <span
                  aria-hidden="true"
                  className={`inline-block h-4 w-4 shrink-0 rounded-full border-2 ${
                    selected ? 'border-brand-500 bg-brand-500 shadow-[inset_0_0_0_3px_white]' : 'border-border bg-surface'
                  }`}
                />
                <span className="min-w-0">
                  <strong className="block text-sm font-bold text-ink-900">{option.label}</strong>
                  <span className="mt-heading-gap block text-xs text-ink-500">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
