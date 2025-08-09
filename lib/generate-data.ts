export type SeriesPoint = { date: string; value: number }

export function generateDailySeries(
  start: Date,
  end: Date,
  opts?: { seed?: number; base?: number; spread?: number },
): SeriesPoint[] {
  const seed = opts?.seed ?? 1
  const base = opts?.base ?? 200
  const spread = opts?.spread ?? 60

  const rand = mulberry32(seed)
  const out: SeriesPoint[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const noise = (rand() - 0.5) * 2 // -1..1
    const wave = Math.sin(cur.getTime() / (1000 * 60 * 60 * 24 * 7)) // weekly-ish
    const value = Math.max(0, Math.round(base + wave * spread * 0.8 + noise * spread))
    out.push({ date: cur.toISOString().slice(0, 10), value })
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function densifySeries(points: SeriesPoint[], factor = 5): SeriesPoint[] {
  if (!Array.isArray(points) || points.length <= 1 || factor <= 1) return points
  const out: SeriesPoint[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const start = new Date(a.date).getTime()
    const end = new Date(b.date).getTime()
    const delta = end - start

    // Always include the segment start
    out.push({ date: new Date(start).toISOString(), value: a.value })

    // Insert intermediate bars at regular intervals
    for (let k = 1; k < factor; k++) {
      const t = start + (delta * k) / factor
      const v = a.value + ((b.value - a.value) * k) / factor
      out.push({ date: new Date(t).toISOString(), value: Math.round(v) })
    }
  }

  // Include the final original point
  const last = points[points.length - 1]
  out.push({ date: new Date(last.date).toISOString(), value: last.value })

  return out
}
