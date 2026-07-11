import rawSeed from '../../seed.json'
import type { Seed } from '../types/domain'

export const RAW_SEED = rawSeed as unknown as Seed

export function cloneSeed(): Seed {
  return structuredClone(RAW_SEED)
}
