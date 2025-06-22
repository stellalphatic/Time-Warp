"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { Worklog } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

export function TodaysHoursCard() {
  const { user } = useAuth();
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();

    const q = query(
      collection(db, "worklogs"),
      where("userId", "==", user.uid),
      where("status", "==", "completed"),
      where("endTime", ">=", startOfToday)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let seconds = 0;
      snapshot.forEach(doc => {
        seconds += (doc.data() as Worklog).duration;
      });
      setTotalSeconds(seconds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
          <Clock className="h-5 w-5" />
          TODAY'S HOURS
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-full">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="text-center">
            <p className="font-code text-5xl font-bold text-foreground">
              {formatDuration(totalSeconds)}
            </p>
            <p className="text-muted-foreground text-sm">Total time tracked today.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
