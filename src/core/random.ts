/** Small seeded PRNG so sample data is identical on every load and in tests. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    chance: (p: number) => next() < p,
    /** Index drawn from cumulative weights. */
    weighted(weights: readonly number[]): number {
      const total = weights.reduce((s, w) => s + w, 0)
      let r = next() * total
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]!
        if (r <= 0) return i
      }
      return weights.length - 1
    },
    /** Rough normal distribution (sum of uniforms). */
    normal(mean: number, sd: number) {
      return mean + sd * (next() + next() + next() + next() - 2) * 1.22
    },
  }
}

export type Rng = ReturnType<typeof rng>

export const zipfWeights = (n: number, s = 1.05) =>
  Array.from({ length: n }, (_, i) => 1 / (i + 1) ** s)
