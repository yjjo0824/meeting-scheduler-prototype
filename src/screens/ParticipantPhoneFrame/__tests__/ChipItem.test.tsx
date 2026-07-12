import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Chip } from '../../../types/domain'
import { ChipItem, chipTimeLabel } from '../ChipItem'
import { ConditionTypeSheet } from '../ConditionTypeSheet'

function render(chip: Chip): string {
  return renderToStaticMarkup(<ChipItem chip={chip} onDelete={() => {}} onRequestChange={() => {}} />)
}

const hardChip: Chip = { type: '불가', day: '수', hours: [14, 15, 16, 17], cue: '외부 미팅' }
const avoidChip: Chip = { type: '회피', day: '금', hours: [17], cue: '웬만하면' }
const mergedChip: Chip = { type: '병합', day: '월', hours: [17] }

describe('ChipItem — 수정 가능 조건 카드(불가·회피)', () => {
  it('참석 어려움 카드: 상태 라벨 + 시간 + cue + 명시적 "조건 바꾸기" 버튼', () => {
    const html = render(hardChip)
    expect(html).toContain('참석 어려움')
    expect(html).toContain('수요일 오후 2시–5시')
    expect(html).toContain('“외부 미팅”에서 이해했어요')
    expect(html).toContain('조건 바꾸기')
  })

  it('가급적 피함 카드에도 "조건 바꾸기"가 보인다', () => {
    const html = render(avoidChip)
    expect(html).toContain('가급적 피함')
    expect(html).toContain('금요일 오후 5시')
    expect(html).toContain('“웬만하면”에서 이해했어요')
    expect(html).toContain('조건 바꾸기')
  })

  it('조건 바꾸기는 실제 button이고 aria-label에 시간과 현재 조건을 포함한다', () => {
    const html = render(hardChip)
    expect(html).toContain('aria-label="수요일 오후 2시–5시 조건 바꾸기, 현재 참석 어려움"')
    const buttonIdx = html.indexOf('조건 바꾸기, 현재')
    expect(html.lastIndexOf('<button', buttonIdx)).toBeGreaterThan(-1)
  })
})

describe('ChipItem — 캘린더 병합 조건은 정보 전용 카드(SPEC R5·R6)', () => {
  const html = render(mergedChip)

  it('출처 중심 문구 + 시간 + 보조 문구로 표현된다', () => {
    expect(html).toContain('캘린더에서 확인')
    expect(html).toContain('월요일 오후 5시')
    expect(html).toContain('이미 등록된 일정과 같아요')
  })

  it('"조건 바꾸기" 버튼과 chevron이 없다', () => {
    expect(html).not.toContain('조건 바꾸기')
    expect(html).not.toContain('⌄')
    expect(html).not.toContain('›')
  })

  it('탭 가능한 카드처럼 보이는 장치가 없다 — 카드 자체에 role/tabindex/hover/cursor 없음', () => {
    // 카드 루트(div)는 클릭 대상이 아니다. 내부의 button은 삭제(×) 하나뿐이다.
    expect(html).not.toContain('tabindex')
    expect(html).not.toContain('cursor-pointer')
    expect((html.match(/<button/g) ?? []).length).toBe(1)
    expect(html).toContain('aria-label="삭제"')
    // 회색 정보 카드로 구분하되(무채 배경) disabled처럼 흐리지 않다.
    expect(html).toContain('bg-surface-muted')
    expect(html).not.toContain('opacity')
  })
})

describe('ConditionTypeSheet — 조건 변경 바텀시트', () => {
  function renderSheet(currentType: '불가' | '회피'): string {
    return renderToStaticMarkup(
      <ConditionTypeSheet
        open
        timeLabel={chipTimeLabel(hardChip)}
        currentType={currentType}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    )
  }

  it('닫힌 상태에서는 아무것도 렌더하지 않는다', () => {
    const html = renderToStaticMarkup(
      <ConditionTypeSheet open={false} timeLabel="" currentType="불가" onSelect={() => {}} onClose={() => {}} />,
    )
    expect(html).toBe('')
  })

  it('dialog + radiogroup 구조로 선택지 두 개(참석 어려움/가급적 피함)만 제공한다', () => {
    const html = renderSheet('불가')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('role="radiogroup"')
    expect((html.match(/role="radio"/g) ?? []).length).toBe(2)
    expect(html).toContain('참석 어려움')
    expect(html).toContain('이 시간에는 참석할 수 없어요')
    expect(html).toContain('가급적 피함')
    expect(html).toContain('가능하면 다른 시간을 원해요')
    expect(html).toContain('수요일 오후 2시–5시')
  })

  it('현재 선택된 조건이 aria-checked로 표시된다(색만으로 구분하지 않음)', () => {
    const hard = renderSheet('불가')
    const checkedIdx = hard.indexOf('aria-checked="true"')
    expect(hard.slice(checkedIdx, hard.indexOf('</button>', checkedIdx))).toContain('참석 어려움')
    expect((hard.match(/aria-checked="true"/g) ?? []).length).toBe(1)

    const avoid = renderSheet('회피')
    const avoidIdx = avoid.indexOf('aria-checked="true"')
    expect(avoid.slice(avoidIdx, avoid.indexOf('</button>', avoidIdx))).toContain('가급적 피함')
  })

  it('별도 저장 버튼이 없다 — 선택지가 곧 적용 버튼이다', () => {
    const html = renderSheet('불가')
    expect(html).not.toContain('변경하기')
    expect(html).not.toContain('저장')
  })
})
