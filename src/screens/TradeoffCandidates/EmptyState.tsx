import { PageContainer } from '../../shared/PageContainer'

export function EmptyState() {
  return (
    <PageContainer width="content" className="text-center">
      <div className="mx-auto max-w-content-narrow space-y-2">
        <p className="text-base font-bold text-ink-900">가능한 시간이 없어요</p>
        <p className="text-sm text-ink-700">필수/선택 분류나 조건을 조정해보세요</p>
      </div>
    </PageContainer>
  )
}
