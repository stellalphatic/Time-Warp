"use client"

import type { Worklog } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { subYears, addDays, format, getDay } from "date-fns"

const ContributionGraph = ({ worklogs }: { worklogs: Worklog[] }) => {
  const dataByDate = new Map<string, { hours: number }>()
  worklogs.forEach((log) => {
    const dateStr = format(new Date(log.endTime), "yyyy-MM-dd")
    const existing = dataByDate.get(dateStr) || { hours: 0 }
    existing.hours += log.duration / 3600
    dataByDate.set(dateStr, existing)
  })

  const today = new Date()
  const yearAgo = subYears(today, 1)

  const days = Array.from({ length: 365 + 1 }, (_, i) => addDays(yearAgo, i))

  const firstDayOffset = getDay(days[0]) === 0 ? 6 : getDay(days[0]) - 1; // Monday as 0

  const getColor = (hours: number | undefined) => {
    if (!hours || hours === 0) return "bg-muted/40"
    if (hours < 2) return "bg-primary/20"
    if (hours < 4) return "bg-primary/40"
    if (hours < 6) return "bg-primary/70"
    return "bg-primary"
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const getMonthLabels = () => {
    const labels: {name: string, index: number}[] = []
    let lastMonth = -1
    days.forEach((day, i) => {
        const weekIndex = Math.floor((i + firstDayOffset) / 7)
        const month = day.getMonth()
        if(month !== lastMonth){
            labels.push({name: monthLabels[month], index: weekIndex})
            lastMonth = month
        }
    })
    return labels
  }

  const monthSpans = getMonthLabels()

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Activity Heatmap</CardTitle>
        <CardDescription>Your work logged over the last year.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-3">
             <div className="flex flex-col text-xs text-muted-foreground pt-5">
                <div className="h-3.5"></div>
                <div className="h-3.5">Mon</div>
                <div className="h-3.5"></div>
                <div className="h-3.5">Wed</div>
                <div className="h-3.5"></div>
                <div className="h-3.5">Fri</div>
                <div className="h-3.5"></div>
            </div>
            <div className="overflow-x-auto w-full">
                <div className="relative">
                    <div className="flex pl-1 mb-1 text-xs text-muted-foreground" style={{gap: '14px'}}>
                        {monthSpans.map(m => <span key={m.name}>{m.name}</span>)}
                    </div>
                    <div className="grid grid-rows-7 grid-flow-col gap-1">
                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                        <div key={`pad-start-${i}`} className="w-3.5 h-3.5" />
                    ))}
                    {days.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd")
                        const data = dataByDate.get(dateStr)
                        return (
                        <Tooltip key={dateStr}>
                            <TooltipTrigger asChild>
                            <div className={`w-3.5 h-3.5 rounded-sm ${getColor(data?.hours)}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                            <p className="font-semibold font-code">
                                {data?.hours?.toFixed(1) ?? "No"} hours
                            </p>
                            <p className="text-muted-foreground">{format(day, "PPP")}</p>
                            </TooltipContent>
                        </Tooltip>
                        )
                    })}
                    </div>
                </div>
            </div>
          </div>
           <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-muted/40" />
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/20" />
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/40" />
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/70" />
            <div className="w-3.5 h-3.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

export default ContributionGraph