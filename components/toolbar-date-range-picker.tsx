"use client"

import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { useChartsSync } from "@/components/charts-sync-provider"

export default function ToolbarDateRangePicker() {
  const { dateRange } = useChartsSync()

  return (
    <div className="ml-auto shrink-0">
      <DateRangePicker
        value={dateRange}
        onChange={() => { }}
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
  )
}