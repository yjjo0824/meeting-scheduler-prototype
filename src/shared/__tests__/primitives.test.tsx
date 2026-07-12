import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'

describe('Button', () => {
  it('기본은 primary 변형으로 렌더된다(semantic 토큰 action-primary 소비)', () => {
    const html = renderToStaticMarkup(<Button>확인</Button>)
    expect(html).toContain('확인')
    expect(html).toContain('bg-action-primary')
  })

  it('variant="secondary"/"text"는 서로 다른 클래스를 적용한다', () => {
    const secondary = renderToStaticMarkup(<Button variant="secondary">보조</Button>)
    const text = renderToStaticMarkup(<Button variant="text">텍스트</Button>)
    expect(secondary).toContain('bg-action-secondary')
    expect(text).not.toContain('bg-action-secondary')
    expect(text).not.toContain('bg-action-primary')
  })

  it('높이·라운드는 component 토큰 유틸리티(h-control/rounded-button)에서 온다', () => {
    const md = renderToStaticMarkup(<Button>확인</Button>)
    const sm = renderToStaticMarkup(<Button size="sm">확인</Button>)
    expect(md).toContain('h-control')
    expect(md).toContain('rounded-button')
    expect(sm).toContain('h-control-sm')
  })

  it('임의의 속성(data-tour-id 등)이 그대로 전달된다', () => {
    const html = renderToStaticMarkup(<Button data-tour-id="remind-button">보내기</Button>)
    expect(html).toContain('data-tour-id="remind-button"')
  })
})

describe('Badge', () => {
  it('tone별로 다른 색 토큰 클래스를 적용한다', () => {
    expect(renderToStaticMarkup(<Badge tone="brand">잠정</Badge>)).toContain('bg-brand-50')
    expect(renderToStaticMarkup(<Badge tone="warn">답변 전</Badge>)).toContain('bg-warn-50')
  })
})

describe('Card', () => {
  it('elevated 여부에 따라 그림자 토큰이 달라진다', () => {
    expect(renderToStaticMarkup(<Card>내용</Card>)).toContain('shadow-card')
    expect(renderToStaticMarkup(<Card elevated>내용</Card>)).toContain('shadow-elevated')
  })
})
