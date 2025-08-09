"use client"

import * as React from "react"
import { useChartsSync } from "@/components/charts-sync-provider"

/**
 * Renders vertical reference lines across the entire charts grid.
 * - One line per column in responsive mode (based on the first row).
 * - One line in non-responsive mode (single column).
 * - Follows the shared hoverRatio (0..1) from context.
 */
export default function ColumnCrosshairOverlay({ gridRef }: { gridRef: React.RefObject<HTMLDivElement> }) {
  const { hoverRatio } = useChartsSync()
  const [positions, setPositions] = React.useState<number[]>([])

  const computePositions = React.useCallback(() => {
    const gridEl = gridRef.current
    if (!gridEl || hoverRatio == null) {
      setPositions([])
      return
    }

    // All chart wrappers have data-chart-index
    const items = Array.from(gridEl.querySelectorAll<HTMLElement>("[data-chart-index]"))
    if (items.length === 0) {
      setPositions([])
      return
    }

    // Determine first row by smallest offsetTop (tolerance for subpixel differences)
    const minTop = Math.min(...items.map((el) => el.offsetTop))
    const firstRow = items.filter((el) => Math.abs(el.offsetTop - minTop) < 2)
    if (firstRow.length === 0) {
      setPositions([])
      return
    }

    const gridRect = gridEl.getBoundingClientRect()
    const xs = firstRow.map((el) => {
      const r = el.getBoundingClientRect()
      const xWithinColumn = r.width > 0 ? Math.max(0, Math.min(1, hoverRatio)) * r.width : 0
      // Position relative to the grid container
      return r.left - gridRect.left + xWithinColumn
    })

    setPositions(xs)
  }, [gridRef, hoverRatio])

  // Recompute whenever hoverRatio changes or on resize
  React.useEffect(() => {
    computePositions()
  }, [computePositions])

  React.useEffect(() => {
    const gridEl = gridRef.current
    if (!gridEl) return
    const ro = new ResizeObserver(() => computePositions())
    ro.observe(gridEl)
    // Observe immediate children too to capture layout changes
    Array.from(gridEl.children).forEach((c) => ro.observe(c as Element))
    const onScroll = () => computePositions()
    window.addEventListener("resize", computePositions)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", computePositions)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [gridRef, computePositions])

  if (hoverRatio == null || positions.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0">
      {positions.map((left, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-2 rounded bg-black/20"
          style={{
            left,
            transform: "translateX(-50%)",
          }}
          aria-hidden
        />
      ))}
    </div>
  )
}
