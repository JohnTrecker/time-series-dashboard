"use client"

import { useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useChartsSync } from "@/components/charts-sync-provider"

type Point = { date: string; value: number }

export default function TimeSeriesChart({
  data,
  color = "#0072db",
  height = 160,
  title = "Chart",
}: {
  data: Point[]
  color?: string
  height?: number
  title?: string
}) {
  const { dateRange, setHoverRatio, hoverRatio } = useChartsSync()

  // Filter by global date range
  const filtered = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return data
    const fromClone = new Date(dateRange.from)
    fromClone.setHours(0, 0, 0, 0)
    const toClone = new Date(dateRange.to)
    toClone.setHours(23, 59, 59, 999)
    const fromMs = fromClone.getTime()
    const toMs = toClone.getTime()
    return data.filter((d) => {
      const t = new Date(d.date).getTime()
      return t >= fromMs && t <= toMs
    })
  }, [data, dateRange])

  // Drag selection state local to this chart for live overlay
  const [dragStartIdx, setDragStartIdx] = useState<number | null>(null)
  const [dragCurrentIdx, setDragCurrentIdx] = useState<number | null>(null)
  const draggingRef = useRef(false)

  // Calculate crosshair value based on global hoverRatio
  const crosshairValue = useMemo(() => {
    if (hoverRatio == null || filtered.length === 0) return null
    const dataIndex = Math.round(hoverRatio * (filtered.length - 1))
    const clampedIndex = Math.max(0, Math.min(filtered.length - 1, dataIndex))
    const point = filtered[clampedIndex]
    return point ? { value: point.value, date: point.date } : null
  }, [hoverRatio, filtered])

  // Selection overlay helpers
  const selectionRange = useMemo(() => {
    if (dragStartIdx == null || dragCurrentIdx == null || filtered.length === 0) return null
    const a = Math.max(0, Math.min(filtered.length - 1, dragStartIdx))
    const b = Math.max(0, Math.min(filtered.length - 1, dragCurrentIdx))
    const [s, e] = a <= b ? [a, b] : [b, a]
    const start = filtered[s]?.date
    const end = filtered[e]?.date
    if (!start || !end) return null
    return { start, end }
  }, [dragStartIdx, dragCurrentIdx, filtered])

  return (
    <ChartContainer
      className="w-full h-full"
      config={{
        series: { label: title, color },
      }}
    >
      <div className="w-full flex flex-col" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filtered}
            syncId="sync-all"
            onMouseMove={(state: any) => {
              if (!state || typeof state?.activeTooltipIndex !== "number") return
              // Update selection drag index if dragging
              if (draggingRef.current) {
                setDragCurrentIdx(state.activeTooltipIndex)
              }
              // Broadcast normalized hover for cross-grid overlay
              if (filtered.length > 1) {
                const idx = Math.max(0, Math.min(filtered.length - 1, state.activeTooltipIndex))
                const r = idx / (filtered.length - 1)
                setHoverRatio(r)
              }
            }}
            onMouseLeave={() => {
              setHoverRatio(null)
              if (draggingRef.current) {
                draggingRef.current = false
                setDragStartIdx(null)
                setDragCurrentIdx(null)
              }
            }}
            onMouseDown={(state: any) => {
              if (!state || typeof state?.activeTooltipIndex !== "number") return
              draggingRef.current = true
              const idx = Math.max(0, Math.min(filtered.length - 1, state.activeTooltipIndex))
              setDragStartIdx(idx)
              setDragCurrentIdx(idx)
            }}
            onMouseUp={(state: any) => {
              if (!draggingRef.current) return
              draggingRef.current = false
              const startIdx = dragStartIdx
              const endIdx =
                typeof state?.activeTooltipIndex === "number"
                  ? Math.max(0, Math.min(filtered.length - 1, state.activeTooltipIndex))
                  : dragCurrentIdx
              if (startIdx != null && endIdx != null) {
                const [a, b] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
                const startDate = filtered[a]?.date
                const endDate = filtered[b]?.date
                if (startDate && endDate) {
                  const from = new Date(startDate)
                  const to = new Date(endDate)
                  const ev = new CustomEvent("charts:set-range", { detail: { from, to } })
                  window.dispatchEvent(ev)
                }
              }
              setDragStartIdx(null)
              setDragCurrentIdx(null)
            }}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#f4f4f5" />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <Bar dataKey="value" fill="var(--color-series)" radius={[6, 6, 6, 6]} maxBarSize={12} />

            {selectionRange && (
              <ReferenceArea
                x1={selectionRange.start}
                x2={selectionRange.end}
                fill="rgba(0,0,0,0.08)"
                strokeOpacity={0}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <div className="text-sm text-[#09090b]">{title}</div>
          {crosshairValue && (
            <div className="text-sm text-[#71717a] mt-1">
              Value: {crosshairValue.value.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </ChartContainer>
  )
}

// Bridge: when any chart sets a new range, forward to provider
if (typeof window !== "undefined") {
  window.addEventListener("charts:set-range", (e: any) => {
    const detail = e.detail as { from: Date; to: Date }
    const evt = new CustomEvent("charts:provider:set-range", { detail })
    window.dispatchEvent(evt)
  })
}
