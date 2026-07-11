const isDev = import.meta.env?.DEV ?? true
const isTest = import.meta.env?.MODE === 'test'

export function assertInvariant(condition: boolean, message: string): void {
  if (condition) return
  if (isDev || isTest) {
    throw new Error(`[invariant] ${message}`)
  }
  console.error(`[invariant] ${message}`)
}
