"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import type { Worklog } from "@/lib/types"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart3, Loader2, FileWarning } from "lucide-react"

const chartConfig = {
  hours: {
    label: "Hours",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function WeeklyHoursChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ day: string; hours: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "worklogs"),
      where("userId", "==", user.uid),
      where("status", "==", "completed")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
      const startOfWeek = new Date(today);
      // Set to the last Monday.
      startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); 
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekTime = startOfWeek.getTime();

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      const endOfWeekTime = endOfWeek.getTime();
      
      const days = [
        { day: "Mon", hours: 0 },
        { day: "Tue", hours: 0 },
        { day: "Wed", hours: 0 },
        { day: "Thu", hours: 0 },
        { day: "Fri", hours: 0 },
        { day: "Sat", hours: 0 },
        { day: "Sun", hours: 0 },
      ];
      
      const weeklyLogs = snapshot.docs
        .map(doc => doc.data() as Worklog)
        .filter(log => log.endTime >= startOfWeekTime && log.endTime < endOfWeekTime);

      weeklyLogs.forEach(log => {
        const logDate = new Date(log.endTime);
        let logDay = logDate.getDay(); // Sun-0
        logDay = logDay === 0 ? 6 : logDay - 1; // Mon-0
        if(days[logDay]) {
            days[logDay].hours += log.duration / 3600; // convert seconds to hours
        }
      });

      setChartData(days);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching weekly data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
          <BarChart3 className="h-5 w-5" />
          WEEKLY HOURS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chartData.reduce((acc, curr) => acc + curr.hours, 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                <FileWarning className="w-16 h-16 mb-4 text-primary/30" />
                <h3 className="font-headline text-lg text-primary">No Data This Week</h3>
                <p>Track some time to see your weekly progress.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--card))' }}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="hours" fill="var(--color-hours)" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )
        }
      </CardContent>
    </Card>
  )
}
