"use client"

import * as React from "react"
import { useChartsSync } from "@/components/charts-sync-provider"
import { useChartPersistence } from "@/hooks/use-chart-persistence"

/**
 * Renders a single vertical crosshair line that extends from top to bottom chart
 * in drag/resize mode (non-responsive). Shows at the same relative X-axis position
 * based on hover state. Appears above non-resized charts but below resized charts.
 */
export default function DragModeCrosshairOverlay({ 
  containerRef 
}: { 
  containerRef: React.RefObject<HTMLDivElement> 
}) {
  const { hoverRatio } = useChartsSync()
  const { layouts } = useChartPersistence()
  const [crosshairLine, setCrosshairLine] = React.useState<{
    x: number
    top: number
    bottom: number
  } | null>(null)

  const computeCrosshairLine = React.useCallback(() => {
    const containerEl = containerRef.current
    if (!containerEl || hoverRatio == null) {
      setCrosshairLine(null)
      return
    }

    // Find all resizable chart containers
    const chartContainers = Array.from(containerEl.querySelectorAll<HTMLElement>('[data-rnd]'))
    
    if (chartContainers.length === 0) {
      setCrosshairLine(null)
      return
    }

    const containerRect = containerEl.getBoundingClientRect()
    
    // Find the bounds of only non-resized charts
    let topMost = Infinity
    let bottomMost = -Infinity
    let crosshairX: number | null = null
    let hasNonResizedCharts = false
    
    chartContainers.forEach((chartEl, index) => {
      // Get the chart ID from the data attribute or infer from index
      const chartId = `chart-${index}`
      const savedLayout = layouts.find(layout => layout.id === chartId)
      
      // Chart is considered "resized" if it has a saved layout with non-default dimensions
      // Default size is viewportWidth - 80 x 240
      const defaultWidth = window.innerWidth - 80
      const defaultHeight = 240
      const isResized = savedLayout && (
        savedLayout.width !== defaultWidth || savedLayout.height !== defaultHeight
      )
      
      // Skip resized charts
      if (isResized) return
      
      hasNonResizedCharts = true
      
      // Find the chart content area (skip the drag handle header)
      const chartContent = chartEl.querySelector<HTMLElement>('.flex-1')
      const contentRect = chartContent ? chartContent.getBoundingClientRect() : chartEl.getBoundingClientRect()
      
      // Use the first non-resized chart to determine X position
      if (crosshairX === null) {
        const relativeX = Math.max(0, Math.min(1, hoverRatio)) * contentRect.width
        crosshairX = contentRect.left - containerRect.left + relativeX
      }
      
      // Track the vertical bounds
      const top = contentRect.top - containerRect.top
      const bottom = top + contentRect.height
      
      topMost = Math.min(topMost, top)
      bottomMost = Math.max(bottomMost, bottom)
    })
    
    // Only show crosshair if there are non-resized charts
    if (!hasNonResizedCharts) {
      setCrosshairLine(null)
      return
    }

    if (crosshairX !== null && topMost !== Infinity && bottomMost !== -Infinity) {
      setCrosshairLine({
        x: crosshairX,
        top: topMost,
        bottom: bottomMost
      })
    } else {
      setCrosshairLine(null)
    }
  }, [containerRef, hoverRatio, layouts])

  // Recompute whenever hoverRatio changes
  React.useEffect(() => {
    computeCrosshairLine()
  }, [computeCrosshairLine])

  // Recompute on resize and layout changes
  React.useEffect(() => {
    const containerEl = containerRef.current
    if (!containerEl) return

    const ro = new ResizeObserver(() => computeCrosshairLine())
    ro.observe(containerEl)
    
    // Also observe chart containers for position/size changes
    const chartContainers = containerEl.querySelectorAll('[data-rnd]')
    chartContainers.forEach(chart => ro.observe(chart))

    const onResize = () => computeCrosshairLine()
    window.addEventListener("resize", onResize)
    
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [containerRef, computeCrosshairLine])

  if (hoverRatio == null || !crosshairLine) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className="absolute bg-blue-500/70 rounded-sm"
        style={{
          left: crosshairLine.x,
          top: crosshairLine.top,
          width: 2,
          height: crosshairLine.bottom - crosshairLine.top,
          transform: "translateX(-50%)",
        }}
        aria-hidden
      />
    </div>
  )
}