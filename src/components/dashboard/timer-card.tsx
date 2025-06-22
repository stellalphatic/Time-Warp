"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-provider"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, increment } from "firebase/firestore"
import type { Worklog, Company, Project } from "@/lib/types"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, Pause, Loader2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { AddCompanyDialog } from "@/components/company/add-company-dialog"
import { AddProjectDialog } from "@/components/project/add-project-dialog"

const formatTime = (seconds: number, showSeconds = true) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const parts = [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
  ];
  if (showSeconds) {
    parts.push(String(secs).padStart(2, "0"))
  }
  return parts.join(":")
}

export function TimerCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeWorklog, setActiveWorklog] = useState<Worklog | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');

  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);

  // Fetch companies and projects
  useEffect(() => {
    if (!user) return;
    const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid));
    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubCompanies = onSnapshot(companiesQuery, snapshot => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });
    const unsubProjects = onSnapshot(projectsQuery, snapshot => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    return () => {
      unsubCompanies();
      unsubProjects();
    };
  }, [user]);

  // Subscribe to active worklog
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "worklogs"),
      where("userId", "==", user.uid),
      where("status", "in", ["running", "paused"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setActiveWorklog(null);
        setElapsedTime(0);
        setSelectedCompany('');
        setSelectedProject('');
        setDescription('');
      } else {
        const log = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Worklog;
        setActiveWorklog(log);
        setSelectedCompany(log.companyId);
        if (log.projectId) setSelectedProject(log.projectId);
        if (log.description) setDescription(log.description);
      }
      setLoading(false);
    }, (error) => {
      console.error("Timer snapshot listener error:", error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not fetch active timer state. ${error.message}` });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeWorklog?.status === 'running') {
      interval = setInterval(() => {
        const now = Date.now();
        const start = activeWorklog.startTime;
        const totalPaused = activeWorklog.totalPausedTime || 0;
        setElapsedTime(Math.floor((now - start - totalPaused) / 1000));
      }, 1000);
    } else if (activeWorklog?.status === 'paused' && activeWorklog.pauseStartTime) {
        const elapsed = (activeWorklog.pauseStartTime - activeWorklog.startTime - (activeWorklog.totalPausedTime || 0)) / 1000
        setElapsedTime(Math.max(0, Math.floor(elapsed)));
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorklog]);


  const handleStart = async () => {
    if (!user || !selectedCompany) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a company first.' });
      return;
    }
    const newWorklog: Omit<Worklog, 'id'> = {
      userId: user.uid,
      companyId: selectedCompany,
      projectId: selectedProject || null,
      description: description,
      startTime: Date.now(),
      endTime: 0,
      status: 'running',
      totalPausedTime: 0,
      duration: 0,
      createdAt: Date.now(),
    };
    try {
      const docRef = await addDoc(collection(db, "worklogs"), newWorklog);
      setActiveWorklog({ id: docRef.id, ...newWorklog });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Starting Timer', description: `Could not start timer. ${error.message}` });
    }
  };

  const handlePause = async () => {
    if (!activeWorklog) return;
    try {
      await updateDoc(doc(db, "worklogs", activeWorklog.id), {
        status: 'paused',
        pauseStartTime: Date.now(),
      });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error Pausing Timer', description: `Could not pause timer. ${error.message}` });
    }
  };

  const handleResume = async () => {
    if (!activeWorklog || !activeWorklog.pauseStartTime) return;
    try {
      const pausedDuration = Date.now() - activeWorklog.pauseStartTime;
      await updateDoc(doc(db, "worklogs", activeWorklog.id), {
        status: 'running',
        totalPausedTime: increment(pausedDuration),
        pauseStartTime: null,
      });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error Resuming Timer', description: `Could not resume timer. ${error.message}` });
    }
  };

  const handleStop = async () => {
    if (!activeWorklog) return;
     if (!selectedCompany) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot clock out without a company selected.' });
      return;
    }
    try {
      const worklogRef = doc(db, "worklogs", activeWorklog.id);
      const endTime = Date.now();
      
      let finalPausedTime = activeWorklog.totalPausedTime || 0;
      if (activeWorklog.status === 'paused' && activeWorklog.pauseStartTime) {
        finalPausedTime += (endTime - activeWorklog.pauseStartTime);
      }
      
      const duration = Math.floor((endTime - activeWorklog.startTime - finalPausedTime) / 1000);
      
      await updateDoc(worklogRef, {
        status: 'completed',
        endTime: endTime,
        duration: Math.max(0, duration), // Ensure duration is not negative
        description: description,
        companyId: selectedCompany,
        projectId: selectedProject || null,
        // No need to update totalPausedTime here as it's already incremented on resume
        // and the final pause period is calculated in finalPausedTime.
        // We just need to make sure the final document has the correct total.
        // The safest way is to just set it from finalPausedTime.
        totalPausedTime: finalPausedTime,
      });

      toast({ title: 'Session Saved', description: `Logged ${formatTime(Math.max(0, duration))}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Stopping Timer', description: `Could not stop timer. ${error.message}` });
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/30 bg-card/80 backdrop-blur-sm flex items-center justify-center min-h-[450px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </Card>
    );
  }

  const isRunning = activeWorklog?.status === 'running';
  const isPaused = activeWorklog?.status === 'paused';
  const isStopped = !activeWorklog;

  const statusText = isRunning ? "RUNNING" : isPaused ? "PAUSED" : "READY";
  const statusColor = isRunning ? "text-accent" : isPaused ? "text-primary" : "text-muted-foreground";

  const filteredProjects = projects.filter(p => {
    if (!selectedCompany) return !p.companyId && !p.isCompleted;
    return p.companyId === selectedCompany && !p.isCompleted;
  });

  return (
    <>
      <AddCompanyDialog open={showAddCompanyDialog} onOpenChange={setShowAddCompanyDialog} />
      <AddProjectDialog open={showAddProjectDialog} onOpenChange={setShowAddProjectDialog} companyId={selectedCompany} />

      <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-6 p-4 md:p-8">

          <div className={cn("font-headline text-lg tracking-widest px-4 py-1 border-b-2", statusColor)}>
            {statusText}
          </div>

          <div className="w-full bg-black/50 p-4 border border-primary/20 text-center">
            <div className="font-code text-7xl md:text-9xl font-bold text-accent tabular-nums drop-shadow-[0_0_8px_hsl(var(--accent))]">
              {formatTime(elapsedTime)}
            </div>
            <div className="grid grid-cols-3 text-muted-foreground font-headline tracking-widest mt-2">
                <div>HOURS</div>
                <div>MINUTES</div>
                <div>SECONDS</div>
            </div>
          </div>
          
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary/80 font-headline">Company</label>
              <Select value={selectedCompany} onValueChange={val => {
                  if (val === 'add-new') {
                    setShowAddCompanyDialog(true)
                  } else {
                    setSelectedCompany(val);
                    setSelectedProject(''); // Reset project when company changes
                  }
              }} disabled={!isStopped}>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  <SelectItem value="add-new" className="text-accent"><PlusCircle className="inline mr-2 h-4 w-4" />Add New Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary/80 font-headline">Project (Optional)</label>
              <Select value={selectedProject} onValueChange={val => val === 'add-new' ? setShowAddProjectDialog(true) : setSelectedProject(val)} disabled={!isStopped}>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                   <SelectItem value="add-new" className="text-accent" disabled={!selectedCompany && companies.length > 0}>
                        <PlusCircle className="inline mr-2 h-4 w-4" />Add New Project
                   </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="w-full max-w-4xl space-y-2">
            <label className="text-sm font-medium text-primary/80 font-headline">Description (optional)</label>
            <Textarea
              placeholder="What are you working on?"
              className="font-code"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isStopped}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-lg">
            {isStopped && (
              <Button size="lg" onClick={handleStart} className={cn("w-full font-headline text-lg tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]")}>
                <Play className="mr-2 h-5 w-5" /> CLOCK IN
              </Button>
            )}
            {isRunning && (
              <>
                <Button size="lg" onClick={handlePause} variant="outline" className="font-headline text-lg tracking-widest w-full">
                  <Pause className="mr-2 h-5 w-5" /> PAUSE
                </Button>
                <Button size="lg" onClick={handleStop} className={cn("font-headline text-lg tracking-widest w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_hsl(var(--destructive))]")}>
                  <Square className="mr-2 h-5 w-5" /> CLOCK OUT
                </Button>
              </>
            )}
             {isPaused && (
              <>
                <Button size="lg" onClick={handleResume} className={cn("w-full font-headline text-lg tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]")}>
                  <Play className="mr-2 h-5 w-5" /> RESUME
                </Button>
                 <Button size="lg" onClick={handleStop} className={cn("w-full font-headline text-lg tracking-widest w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_hsl(var(--destructive))]")}>
                  <Square className="mr-2 h-5 w-5" /> CLOCK OUT
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
