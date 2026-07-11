interface Props {
  title: string
  body: string
  stepNumber: number
  totalSteps: number
  placement: 'left' | 'right'
  exampleText?: string
  onFillExample?: () => void
}

export function TourStepCard({ title, body, stepNumber, totalSteps, placement, exampleText, onFillExample }: Props) {
  const sideClass = placement === 'left' ? 'left-8' : 'right-8'

  return (
    <div className={`fixed bottom-8 ${sideClass} z-[900] w-80 max-w-[calc(100vw-4rem)] rounded-2xl bg-white p-4 shadow-xl`}>
      <p className="text-xs text-slate-400">
        {stepNumber}/{totalSteps}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      {exampleText && onFillExample && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">예시: "{exampleText}"</p>
          <button
            type="button"
            onClick={onFillExample}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
          >
            예시 문장 채우기
          </button>
        </div>
      )}
    </div>
  )
}
