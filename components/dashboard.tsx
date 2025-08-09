"use client"

import { useMemo, useRef } from "react"
import { CalendarIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChartsSyncProvider, useChartsSync } from "@/components/charts-sync-provider"
import { DateRangePicker } from "@/components/date-range-picker"
import { generateDailySeries, densifySeries } from "@/lib/generate-data"
import TimeSeriesChart from "@/components/time-series-chart"
import ColumnCrosshairOverlay from "@/components/column-crosshair-overlay"

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
  const { responsive, setResponsive, dateRange } = useChartsSync()

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
      <div className="ml-auto shrink-0">
        <DateRangePicker
          value={dateRange}
          onChange={() => {}}
          trigger={
            <Button variant="outline" className="h-9 gap-2 bg-white">
              <CalendarIcon className="h-4 w-4 text-[#71717a]" />
              <span className="text-sm">
                {dateRange.from?.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })} -{" "}
                {dateRange.to?.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
              </span>
            </Button>
          }
        />
      </div>
    </Card>
  )
}

function ChartsGrid() {
  const { responsive } = useChartsSync()
  const gridRef = useRef<HTMLDivElement>(null)

  // Generate 9 deterministic series covering a wide range
  const allSeries = useMemo(() => {
    const start = new Date("2024-01-01")
    const end = new Date("2024-09-01")
    return [
      densifySeries(generateDailySeries(start, end, { seed: 1, base: 220, spread: 80 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 2, base: 200, spread: 70 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 3, base: 210, spread: 75 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 4, base: 230, spread: 60 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 5, base: 215, spread: 65 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 6, base: 225, spread: 85 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 7, base: 190, spread: 70 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 8, base: 200, spread: 80 }), 5),
      densifySeries(generateDailySeries(start, end, { seed: 9, base: 205, spread: 75 }), 5),
    ]
  }, [])

  const row1 = "#0072db"
  const row2 = "#34d399"
  const row3 = "#f87171"
  const colors = [row1, row1, row1, row2, row2, row2, row3, row3, row3]

  const gridClass = responsive
    ? "mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3 relative"
    : "mt-6 grid grid-cols-1 gap-1 relative"

  // NEW: tighter spacing between chart and label when responsive is OFF
  const itemStackClass = responsive ? "space-y-2" : "space-y-1 h-48"

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
