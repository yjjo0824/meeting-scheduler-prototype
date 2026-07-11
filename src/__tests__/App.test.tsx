import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../data/loadSeed'
import App from '../App'

describe('App — 항목 3: 768px 미만에서는 MobileGuardNotice만 남고 제품 화면은 렌더링 트리에서 숨는다', () => {
  it('실제 제품 콘텐츠(HostDashboard 등)는 hidden md:contents wrapper 안에만 존재한다', () => {
    const html = renderToStaticMarkup(<App />)

    const wrapperStart = html.indexOf('class="hidden md:contents"')
    expect(wrapperStart).toBeGreaterThan(-1)

    // 회의명(HostDashboard가 렌더링하는 seed 데이터)은 wrapper 시작 지점보다 뒤에서만 나온다 —
    // 즉 제품 콘텐츠 전체가 그 wrapper 내부에 있다(768px 미만에서 hidden으로 사라짐).
    const titleIndex = html.indexOf(RAW_SEED.meeting.title)
    expect(titleIndex).toBeGreaterThan(wrapperStart)

    // wrapper 앞부분(MobileGuardNotice 자리)에는 제품 콘텐츠가 없다.
    expect(html.slice(0, wrapperStart)).not.toContain(RAW_SEED.meeting.title)
  })
})
