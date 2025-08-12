"use client"

import { Rnd } from "react-rnd"
import { ReactNode, useState } from "react"

interface ResizableChartProps {
  children: ReactNode
  id: string
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  onPositionChange?: (id: string, x: number, y: number) => void
  onSizeChange?: (id: string, width: number, height: number) => void
}

export default function ResizableChart({
  children,
  id,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 320, height: 240 },
  onPositionChange,
  onSizeChange,
}: ResizableChartProps) {
  const [wasResized, setWasResized] = useState<boolean>(false)
  const zIndex = wasResized ? 70 : 20
  return (
    <Rnd
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: defaultSize.height,
      }}
      minWidth={200}
      minHeight={250}
      maxHeight={600}
      bounds="parent"
      dragHandleClassName="chart-drag-handle"
      onDragStop={(e, d) => {
        onPositionChange?.(id, d.x, d.y)
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const width = parseInt(ref.style.width)
        const height = parseInt(ref.style.height)
        onSizeChange?.(id, width, height)
        onPositionChange?.(id, position.x, position.y)
        setWasResized(true)
      }}
      className={`border border-gray-200 rounded-lg bg-white shadow-sm z-${zIndex}`}
      data-rnd="true"
      style={{
        zIndex: 20,
      }}
    >
      <div className="w-full h-full flex flex-col">
        <div className="chart-drag-handle cursor-move h-8 flex-shrink-0 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center px-3">
          <div className="ml-auto text-xs text-gray-800">⋮⋮</div>
        </div>
        <div className="flex-1 p-2 overflow-hidden">
          {children}
        </div>
      </div>
    </Rnd>
  )
}