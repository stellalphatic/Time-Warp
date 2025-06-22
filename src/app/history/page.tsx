"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { Worklog, Company, Project } from "@/lib/types";
import { format, startOfDay, endOfDay } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileWarning, PlusCircle, Clock, Pause, Calendar as CalendarIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { EditWorklogDialog } from "@/components/history/edit-worklog-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formatDuration = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Worklog | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const worklogsQuery = query(collection(db, "worklogs"), where("userId", "==", user.uid));
    const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid));
    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubWorklogs = onSnapshot(worklogsQuery, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worklog));
      const completedLogs = allLogs
        .filter(log => log.status === "completed")
        .sort((a, b) => b.endTime - a.endTime);
      setWorklogs(completedLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching worklogs:", error);
      setLoading(false);
    });

    const unsubCompanies = onSnapshot(companiesQuery, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(comps);
    });

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    return () => {
      unsubWorklogs();
      unsubCompanies();
      unsubProjects();
    };
  }, [user]);
  
  const getCompany = (companyId: string) => companies.find(c => c.id === companyId);
  const getProjectName = (projectId?: string) => projects.find(p => p.id === projectId)?.name || 'N/A';

  const getEarningsForLog = (log: Worklog) => {
    const company = getCompany(log.companyId);
    if (!company || !company.hourlyRate) return `~${company?.currency || 'EUR'} 0.00`;
    const hours = log.duration / 3600;
    const earnings = hours * company.hourlyRate;
    return `~${company.currency} ${earnings.toFixed(2)}`;
  }
  
  const handleEditClick = (log: Worklog) => {
    setSelectedLog(log);
    setIsDialogOpen(true);
  }

  const handleManualEntryClick = () => {
    setSelectedLog(null);
    setIsDialogOpen(true);
  }
  
  const filteredWorklogs = worklogs.filter(log => {
    if (!filterDate) return true;
    const logDate = new Date(log.endTime);
    return logDate >= startOfDay(filterDate) && logDate <= endOfDay(filterDate);
  });

  const groupedWorklogs = filteredWorklogs.reduce((acc, log) => {
    const date = new Date(log.endTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, Worklog[]>);

  const sortedDates = Object.keys(groupedWorklogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  return (
    <div className="space-y-8">
       <EditWorklogDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        worklog={selectedLog}
        companies={companies}
        projects={projects}
       />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">History</h1>
          <p className="text-muted-foreground">View and manage your past work logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !filterDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterDate ? format(filterDate, "PPP") : <span>Filter by date...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {filterDate && <Button variant="ghost" onClick={() => setFilterDate(undefined)}>Clear</Button>}
          <Button variant="outline" onClick={handleManualEntryClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Manual Entry
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredWorklogs.length === 0 ? (
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-6">
                <FileWarning className="w-16 h-16 mb-4 text-primary/30" />
                <h3 className="font-headline text-xl text-primary">No Work Logs Found</h3>
                <p>{filterDate ? "No logs for the selected date." : "Start tracking time to see your history here."}</p>
            </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={sortedDates.length > 0 ? [sortedDates[0]] : []} className="w-full space-y-4">
            {sortedDates.map(date => (
                <AccordionItem key={date} value={date} className="border-primary/30 bg-card/80 backdrop-blur-sm rounded-lg border">
                   <AccordionTrigger className="p-4 font-headline text-xl text-primary hover:no-underline">
                        {date}
                   </AccordionTrigger>
                   <AccordionContent className="p-4 pt-0 space-y-3">
                     {groupedWorklogs[date].map(log => (
                        <Card key={log.id} className="bg-background/40 hover:bg-background/60 cursor-pointer" onClick={() => handleEditClick(log)}>
                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 items-center">
                                <div className="sm:col-span-1">
                                    <h4 className="font-headline text-lg text-primary">{getCompany(log.companyId)?.name || 'N/A'}</h4>
                                    <p className="text-sm text-muted-foreground">{getProjectName(log.projectId)}</p>
                                    {(log.source === 'manual' || log.source === 'edited') && 
                                        <Badge variant="outline" className="mt-2 text-xs capitalize">{log.source}</Badge>
                                    }
                                </div>
                                <div className="font-code text-left flex flex-row sm:flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-accent"/>
                                        <div>
                                            <p className="text-sm font-semibold">{formatTime(log.startTime)} - {formatTime(log.endTime)}</p>
                                            <p className="text-xs text-muted-foreground">Timeline</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Pause className="h-4 w-4 text-primary"/>
                                        <div>
                                            <p className="text-sm font-semibold">{formatDuration(log.totalPausedTime / 1000)}</p>
                                            <p className="text-xs text-muted-foreground">Paused</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="font-code text-left sm:text-right">
                                    <p className="text-3xl font-bold text-foreground drop-shadow-[0_0_5px_hsl(var(--primary))]">{formatDuration(log.duration)}</p>
                                    <p className="text-accent font-semibold drop-shadow-[0_0_5px_hsl(var(--accent))] mt-1">{getEarningsForLog(log)}</p>
                                </div>
                            </CardContent>
                        </Card>
                     ))}
                   </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}
