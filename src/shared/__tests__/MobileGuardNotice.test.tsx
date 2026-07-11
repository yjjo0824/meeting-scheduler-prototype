import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MobileGuardNotice } from '../MobileGuardNotice'

describe('MobileGuardNotice', () => {
  it('"PC에서 보시길 권장해요" 안내를 렌더링한다(md:hidden으로 데스크톱에서는 CSS로 숨김)', () => {
    const html = renderToStaticMarkup(<MobileGuardNotice />)
    expect(html).toContain('PC에서 보시길 권장해요')
    expect(html).toContain('md:hidden')
  })
})
