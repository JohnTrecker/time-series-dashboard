"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import { useChartsSync } from "@/components/charts-sync-provider"

export function DateRangePicker({
  value,
  onChange,
  trigger,
}: {
  value: DateRange
  onChange?: (r: DateRange | undefined) => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(value)
  const { setDateRange } = useChartsSync()

  const handleSelect = (range: DateRange | undefined) => {
    // Always update the local selectedRange to show visual feedback
    setSelectedRange(range)
    
    // Update global state when both dates are selected, but don't close
    if (range?.from && range?.to) {
      // normalize times
      const from = new Date(range.from.toDateString())
      const to = new Date(range.to.toDateString())
      setDateRange({ from, to })
      onChange?.({ from, to })
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  // update context when charts dispatch selection events
  React.useEffect(() => {
    const onExternal = (e: Event) => {
      const customEvent = e as CustomEvent<{ from: Date; to: Date }>
      const { from, to } = customEvent.detail
      const newRange = { from, to }
      setDateRange(newRange)
      setSelectedRange(newRange)
    }
    window.addEventListener("charts:provider:set-range", onExternal)
    return () => window.removeEventListener("charts:provider:set-range", onExternal)
  }, [setDateRange])

  // Update selectedRange when value prop changes
  React.useEffect(() => {
    setSelectedRange(value)
  }, [value])

  const handleOpenChange = (newOpen: boolean) => {
    // Only allow opening, never allow automatic closing
    if (newOpen) {
      setOpen(true)
    }
    // Ignore all close requests - only manual close button can close
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-auto">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 z-10 hover:bg-gray-100"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selectedRange}
            onSelect={handleSelect}
            defaultMonth={value?.from ?? new Date()}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
