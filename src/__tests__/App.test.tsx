import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RAW_SEED } from '../data/loadSeed'
import App from '../App'

describe('App — 12A.8: MobileGuardNotice는 권장 배너일 뿐 제품 콘텐츠를 숨기지 않는다', () => {
  it('HostDashboard 콘텐츠가 hidden 계열 wrapper 없이 렌더된다(768px 미만 차단 해제)', () => {
    const html = renderToStaticMarkup(<App />)

    // 회의명(HostDashboard가 렌더링하는 seed 데이터)이 항상 출력된다 — 폭 조건으로 숨기는
    // wrapper(hidden md:contents 등)가 더 이상 없다.
    expect(html).toContain(RAW_SEED.meeting.title)
    expect(html).not.toContain('hidden md:contents')
  })
})
