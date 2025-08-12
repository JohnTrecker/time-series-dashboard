"use client"

import type React from "react"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"

type LayoutMode = 'vertical' | 'grid' | 'free'

type ChartLayout = {
  x: number
  y: number
  width: number
  height: number
}

type ChartsSyncContextType = {
  hoverRatio: number | null
  setHoverRatio: (r: number | null) => void

  dateRange: DateRange
  setDateRange: (r: DateRange) => void

  responsive: boolean
  setResponsive: (v: boolean) => void

  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void

  chartLayouts: Record<number, ChartLayout>
  setChartLayout: (chartId: number, layout: ChartLayout) => void
}

const ChartsSyncContext = createContext<ChartsSyncContextType | null>(null)

export function ChartsSyncProvider({ children }: { children: React.ReactNode }) {
  // Default date range from the mock
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date("2024-01-20"),
    to: new Date("2024-02-09"),
  })

  // Shared hover ratio (0..1)
  const [hoverRatio, _setHoverRatio] = useState<number | null>(null)
  const hoverTimer = useRef<number | null>(null)
  const setHoverRatio = useCallback((r: number | null) => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    if (r === null) {
      hoverTimer.current = window.setTimeout(() => _setHoverRatio(null), 40)
    } else {
      _setHoverRatio(Math.max(0, Math.min(1, r)))
    }
  }, [])

  const [responsive, setResponsive] = useState(true)

  // Layout mode and chart positions
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [chartLayouts, setChartLayouts] = useState<Record<number, ChartLayout>>({})

  const setChartLayout = useCallback((chartId: number, layout: ChartLayout) => {
    setChartLayouts(prev => ({
      ...prev,
      [chartId]: layout
    }))
  }, [])

  // Listen for programmatic range changes from charts
  if (typeof window !== "undefined") {
    window.addEventListener("charts:provider:set-range", (e: Event) => {
      const customEvent = e as CustomEvent<{ from: Date; to: Date }>
      const { from, to } = customEvent.detail
      setDateRange({ from, to })
    })
  }

  const value = useMemo(
    () => ({
      hoverRatio,
      setHoverRatio,
      dateRange,
      setDateRange,
      responsive,
      setResponsive,
      layoutMode,
      setLayoutMode,
      chartLayouts,
      setChartLayout,
    }),
    [hoverRatio, setHoverRatio, dateRange, responsive, layoutMode, chartLayouts, setChartLayout],
  )

  return <ChartsSyncContext.Provider value={value}>{children}</ChartsSyncContext.Provider>
}

export function useChartsSync() {
  const ctx = useContext(ChartsSyncContext)
  if (!ctx) throw new Error("useChartsSync must be used within ChartsSyncProvider")
  return ctx
}
