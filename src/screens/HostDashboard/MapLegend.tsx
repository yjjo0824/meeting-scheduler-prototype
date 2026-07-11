const ITEMS: Array<{ label: string; swatchClassName: string }> = [
  { label: '참석 어려움', swatchClassName: 'border-ink-700 bg-ink-700' },
  { label: '가급적 피함', swatchClassName: 'border-warn-600 bg-warn-50' },
  { label: '옮길 수 있음', swatchClassName: 'border-2 border-success-600 bg-success-50' },
  { label: '참석 가능', swatchClassName: 'border-border bg-surface' },
]

export function MapLegend() {
  return (
    <ul className="flex flex-wrap justify-end gap-3 text-xs text-ink-700">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded border ${item.swatchClassName}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
