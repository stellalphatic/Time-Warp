"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import type { Worklog, Company, Project } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Loader2, FileWarning } from "lucide-react";

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

export function LastSessionCard() {
  const { user } = useAuth();
  const [lastLog, setLastLog] = useState<Worklog | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "worklogs"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setLastLog(null);
        setCompany(null);
      } else {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worklog));
        const completedLogs = logs.filter(log => log.status === "completed").sort((a, b) => b.endTime - a.endTime);
        
        if (completedLogs.length > 0) {
          const latestLog = completedLogs[0];
          setLastLog(latestLog);

          const companyDocRef = doc(db, "companies", latestLog.companyId);
          const companyDocSnap = await getDoc(companyDocRef);
          if(companyDocSnap.exists()) {
              setCompany({ id: companyDocSnap.id, ...companyDocSnap.data() } as Company);
          } else {
            setCompany(null);
          }

          if (latestLog.projectId) {
            const projectDocRef = doc(db, "projects", latestLog.projectId);
            const projectDocSnap = await getDoc(projectDocRef);
            if(projectDocSnap.exists()) {
              setProjectName(projectDocSnap.data()?.name);
            } else {
              setProjectName("N/A");
            }
          } else {
              setProjectName("N/A");
          }
        } else {
            setLastLog(null);
            setCompany(null);
        }
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching last session:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getEarnings = () => {
    if (!lastLog || !company || !company.hourlyRate) return `~${company?.currency || 'EUR'} 0.00`;
    const hours = lastLog.duration / 3600;
    const earnings = hours * company.hourlyRate;
    return `~${company.currency} ${earnings.toFixed(2)}`;
  }

  return (
    <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
          <History className="h-5 w-5" />
          LAST SESSION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : lastLog ? (
          <div className="font-code text-sm">
            <p><span className="text-muted-foreground">Company:</span> <span className="text-foreground font-semibold">{company?.name || '...'}</span></p>
            <p><span className="text-muted-foreground">Project:</span> <span className="text-foreground font-semibold">{projectName}</span></p>
            <p><span className="text-muted-foreground">Duration:</span> <span className="text-foreground font-semibold">{formatDuration(lastLog.duration)}</span></p>
            <p><span className="text-accent font-semibold drop-shadow-[0_0_5px_hsl(var(--accent))]">{getEarnings()}</span></p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-4">
             <FileWarning className="w-8 h-8 mb-2 text-primary/30" />
            <p>No completed sessions yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
