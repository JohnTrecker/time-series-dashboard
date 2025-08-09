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
  const { setDateRange } = useChartsSync()

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return
    // normalize times
    const from = new Date(range.from.toDateString())
    const to = new Date(range.to.toDateString())
    setDateRange({ from, to })
    onChange?.({ from, to })
    setOpen(false)
  }

  // update context when charts dispatch selection events
  React.useEffect(() => {
    const onExternal = (e: any) => {
      const { from, to } = e.detail as { from: Date; to: Date }
      setDateRange({ from, to })
    }
    window.addEventListener("charts:provider:set-range", onExternal)
    return () => window.removeEventListener("charts:provider:set-range", onExternal)
  }, [setDateRange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={handleSelect}
          defaultMonth={value?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
