"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  const preventCloseRef = React.useRef(false)

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    
    // If we have only a start date, prevent the popover from closing
    if (range?.from && !range?.to) {
      preventCloseRef.current = true
    }
    
    // Only close the popover when both dates are selected
    if (range?.from && range?.to) {
      preventCloseRef.current = false
      // normalize times
      const from = new Date(range.from.toDateString())
      const to = new Date(range.to.toDateString())
      setDateRange({ from, to })
      onChange?.({ from, to })
      setOpen(false)
    }
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
    // If trying to close but we should prevent it, ignore the close request
    if (!newOpen && preventCloseRef.current) {
      return
    }
    
    // Reset prevent close when opening
    if (newOpen) {
      preventCloseRef.current = false
    }
    
    setOpen(newOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-auto">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selectedRange}
          onSelect={handleSelect}
          defaultMonth={value?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
