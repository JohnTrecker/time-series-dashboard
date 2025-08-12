"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ChartsSyncProvider, useChartsSync } from "@/components/charts-sync-provider"
import { generateDailySeries } from "@/lib/generate-data"
import TimeSeriesChart from "@/components/time-series-chart"
import ColumnCrosshairOverlay from "@/components/column-crosshair-overlay"
import ResizableChart from "@/components/resizable-chart"
import { useChartPersistence } from "@/hooks/use-chart-persistence"
import DragModeCrosshairOverlay from "@/components/drag-mode-crosshair-overlay"
import ToolbarDateRangePicker from "@/components/toolbar-date-range-picker"

export default function Dashboard() {
  return (
    <ChartsSyncProvider>
      <DashboardContent />
    </ChartsSyncProvider>
  )
}

function DashboardContent() {
  const { responsive } = useChartsSync()
  const containerClass = responsive ? "mx-auto max-w-6xl px-4 py-6" : "w-full px-4 py-6"

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className={containerClass}>
        <Toolbar />
        <ChartsGrid />
      </div>
    </div>
  )
}

function Toolbar() {
  const { responsive, setResponsive } = useChartsSync()

  return (
    <Card className="w-full flex flex-row items-center space-between gap-4 px-3 py-2 border border-[#e4e4e7] bg-[#ffffff]">
      {/* Left: Responsive toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={responsive}
          onCheckedChange={setResponsive}
          aria-label="Toggle responsive scaling"
          id="responsive-toggle"
        />
        <Label htmlFor="responsive-toggle" className="text-sm font-medium text-[#09090b]">
          Responsive
        </Label>
      </div>

      {/* Right: Date range picker */}
      <ToolbarDateRangePicker />
    </Card>
  )
}

function ChartsGrid() {
  const { responsive } = useChartsSync()
  const gridRef = useRef<HTMLDivElement>(null!)
  const { getLayout, updateLayout, isLoaded } = useChartPersistence()
  const [viewportWidth, setViewportWidth] = useState(800)

  useEffect(() => {
    const updateWidth = () => {
      setViewportWidth(window.innerWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Generate 9 deterministic series covering a wide range
  const allSeries = useMemo(() => {
    const start = new Date("2024-01-01")
    const end = new Date("2024-09-01")
    return [
      generateDailySeries(start, end, { seed: 1, base: 220, spread: 80 }),
      generateDailySeries(start, end, { seed: 2, base: 200, spread: 70 }),
      generateDailySeries(start, end, { seed: 3, base: 210, spread: 75 }),
      generateDailySeries(start, end, { seed: 4, base: 230, spread: 60 }),
      generateDailySeries(start, end, { seed: 5, base: 215, spread: 65 }),
      generateDailySeries(start, end, { seed: 6, base: 225, spread: 85 }),
      generateDailySeries(start, end, { seed: 7, base: 190, spread: 70 }),
      generateDailySeries(start, end, { seed: 8, base: 200, spread: 80 }),
      generateDailySeries(start, end, { seed: 9, base: 205, spread: 75 }),
    ]
  }, [])

  const row1 = "#0072db"
  const row2 = "#34d399"
  const row3 = "#f87171"
  const colors = [row1, row1, row1, row2, row2, row2, row3, row3, row3]

  // In responsive mode, use grid layout. In non-responsive mode, use absolute positioning for drag/drop
  if (responsive) {
    const gridClass = "mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3 relative"
    const itemStackClass = "space-y-2"

    return (
      <div ref={gridRef} className={gridClass}>
        <ColumnCrosshairOverlay gridRef={gridRef} />
        {allSeries.map((series, idx) => (
          <div key={idx} className={`h-48 ${itemStackClass}`} data-chart-index={idx}>
            <TimeSeriesChart title={`Chart ${idx + 1}`} color={colors[idx] ?? "#0072db"} data={series} height={160} />
          </div>
        ))}
      </div>
    )
  }

  // Non-responsive mode: use drag and drop layout
  return (
    <div ref={gridRef} className="mt-6 relative min-h-[800px]" style={{ minHeight: "800px" }}>
      {/* Don't render charts until persistence is loaded to avoid layout flicker */}
      <DragModeCrosshairOverlay containerRef={gridRef} />
      {isLoaded && allSeries.map((series, idx) => {
        const chartId = `chart-${idx}`
        const savedLayout = getLayout(chartId)

        // Default positions in a single vertical column if no saved layout
        const defaultPosition = savedLayout
          ? { x: savedLayout.x, y: savedLayout.y }
          : { x: 20, y: idx * 260 }
        const defaultSize = savedLayout
          ? { width: savedLayout.width, height: savedLayout.height }
          : { width: viewportWidth - 80, height: 240 }

        return (
          <ResizableChart
            key={idx}
            id={chartId}
            defaultPosition={defaultPosition}
            defaultSize={defaultSize}
            onPositionChange={(id, x, y) => {
              updateLayout(id, { x, y })
            }}
            onSizeChange={(id, width, height) => {
              updateLayout(id, { width, height })
            }}
          >
            <TimeSeriesChart
              title={`Chart ${idx + 1}`}
              color={colors[idx] ?? "#0072db"}
              data={series}
              height={200}
            />
          </ResizableChart>
        )
      })}
    </div>
  )
}
