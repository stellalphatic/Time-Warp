"use client"

import type { Worklog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Flame } from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";

const calculateStreaks = (worklogs: Worklog[]) => {
  if (worklogs.length === 0) {
    return { longestStreak: 0, currentStreak: 0 };
  }

  const workDates = [...new Set(worklogs.map(log => format(new Date(log.endTime), 'yyyy-MM-dd')))]
    .map(dateStr => parseISO(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  if (workDates.length === 0) {
    return { longestStreak: 0, currentStreak: 0 };
  }

  let longestStreak = 1;
  let currentStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < workDates.length; i++) {
    const diff = differenceInCalendarDays(workDates[i], workDates[i - 1]);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Check current streak
  const today = new Date();
  const lastWorkDate = workDates[workDates.length - 1];
  const diffFromToday = differenceInCalendarDays(today, lastWorkDate);

  if (diffFromToday <= 1) {
      currentStreak = tempStreak;
  } else {
      currentStreak = 0;
  }
  
  return { longestStreak, currentStreak };
};


export function StreakCard({ worklogs }: { worklogs: Worklog[] }) {
  const { longestStreak, currentStreak } = calculateStreaks(worklogs);

  return (
    <div className="grid grid-cols-2 gap-6">
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline text-primary">Longest Streak</CardTitle>
                <Zap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-code">{longestStreak} days</div>
                <p className="text-xs text-muted-foreground">Your best continuous work run.</p>
            </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline text-primary">Current Streak</CardTitle>
                <Flame className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-code">{currentStreak} days</div>
                 <p className="text-xs text-muted-foreground">{currentStreak > 0 ? "You're on a roll!" : "Log time to start a new streak."}</p>
            </CardContent>
        </Card>
    </div>
  );
}
