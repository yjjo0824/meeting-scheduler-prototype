interface Props {
  title: string
  body: string
  stepNumber: number
  totalSteps: number
}

export function TourStepCard({ title, body, stepNumber, totalSteps }: Props) {
  return (
    <div className="fixed bottom-8 left-1/2 z-[900] w-[90%] max-w-sm -translate-x-1/2 rounded-2xl bg-white p-4 shadow-xl">
      <p className="text-xs text-slate-400">
        {stepNumber}/{totalSteps}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  )
}
