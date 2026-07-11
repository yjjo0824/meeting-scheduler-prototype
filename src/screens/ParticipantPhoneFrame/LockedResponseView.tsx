import { useState } from 'react'
import type { Person } from '../../types/domain'

interface Props {
  person: Person
  reported: boolean
  onReport: () => void
}

export function LockedResponseView({ person, reported, onReport }: Props) {
  const [justReported, setJustReported] = useState(false)

  return (
    <div className="space-y-3 py-4 text-sm text-slate-600">
      <p>회의가 확정됐어요. 응답은 읽기 전용이에요.</p>
      <p className="text-xs text-slate-400">{person.name} 님의 응답은 더 이상 수정할 수 없어요.</p>
      <button
        type="button"
        disabled={reported}
        onClick={() => {
          onReport()
          setJustReported(true)
        }}
        className="rounded border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40"
      >
        확정된 시간에 참석이 어려워졌어요
      </button>
      {(reported || justReported) && (
        <p className="text-xs text-indigo-500">주최자에게 알렸어요. 다시 조율할지는 주최자가 정해요.</p>
      )}
    </div>
  )
}
