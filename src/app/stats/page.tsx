"use client"
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { Worklog, Company, Project } from "@/lib/types";

import { Briefcase, DollarSign, PieChart, Clock, FileWarning, Loader2, Hourglass } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WeeklyHoursChart } from "@/components/dashboard/weekly-hours-chart"
import { Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { StreakCard } from "@/components/stats/streak-card";
import ContributionGraph from "@/components/stats/contribution-graph";


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function StatsPage() {
  const { user } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const worklogsQuery = query(collection(db, "worklogs"), where("userId", "==", user.uid), where("status", "==", "completed"));
    const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid));
    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubWorklogs = onSnapshot(worklogsQuery, (snapshot) => {
      setWorklogs(snapshot.docs.map(doc => doc.data() as Worklog));
      setLoading(false);
    });

    const unsubCompanies = onSnapshot(companiesQuery, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    return () => {
      unsubWorklogs();
      unsubCompanies();
      unsubProjects();
    };
  }, [user]);

  const totalHours = worklogs.reduce((acc, log) => acc + log.duration, 0) / 3600;
  const totalEarnings = worklogs.reduce((acc, log) => {
    const company = companies.find(c => c.id === log.companyId);
    if (company && company.hourlyRate) {
      return acc + (log.duration / 3600) * company.hourlyRate;
    }
    return acc;
  }, 0);

  const projectsWorkedOn = new Set(worklogs.map(log => log.projectId).filter(Boolean)).size;
  
  const avgSessionDuration = worklogs.length > 0 
    ? (worklogs.reduce((acc, log) => acc + log.duration, 0) / worklogs.length)
    : 0;
  
  const formatAvgDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  const earningsByCompanyData = companies.map(company => {
    const companyLogs = worklogs.filter(log => log.companyId === company.id);
    const earnings = companyLogs.reduce((acc, log) => {
      if (company.hourlyRate) {
        return acc + (log.duration / 3600) * company.hourlyRate;
      }
      return acc;
    }, 0);
    return { name: company.name, value: parseFloat(earnings.toFixed(2)) };
  }).filter(item => item.value > 0);
  
  const hoursByCompanyData = companies.map(company => {
    const companyLogs = worklogs.filter(log => log.companyId === company.id);
    const hours = companyLogs.reduce((acc, log) => acc + log.duration, 0) / 3600;
    return { name: company.name, value: parseFloat(hours.toFixed(1)) };
  }).filter(item => item.value > 0);

  const hoursByProjectData = projects.map(project => {
    const projectLogs = worklogs.filter(log => log.projectId === project.id);
    const hours = projectLogs.reduce((acc, log) => acc + log.duration, 0) / 3600;
    return { name: project.name, value: parseFloat(hours.toFixed(1)) };
  }).filter(item => item.value > 0);


  if (loading) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Statistics</h1>
        <p className="text-muted-foreground">Analyze your productivity and work patterns.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline text-primary">Total Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-code text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all companies</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline text-primary">Total Hours</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-code">{totalHours.toFixed(1)} h</div>
            <p className="text-xs text-muted-foreground">Total time tracked</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline text-primary">Projects Worked On</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-code">{projectsWorkedOn}</div>
            <p className="text-xs text-muted-foreground">{companies.length} companies</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline text-primary">Avg. Session</CardTitle>
            <Hourglass className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-code">{formatAvgDuration(avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">{worklogs.length} sessions logged</p>
          </CardContent>
        </Card>
      </div>

      <StreakCard worklogs={worklogs} />
      
      <ContributionGraph worklogs={worklogs} />

      <div className="grid gap-8 md:grid-cols-2">
           <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
             <CardHeader>
               <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                 <PieChart className="h-5 w-5" />
                 Hours by Company
               </CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col items-center justify-center h-80">
                {hoursByCompanyData.length > 0 ? (
                  <ChartContainer config={{}} className="mx-auto aspect-square h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <Pie data={hoursByCompanyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                         {hoursByCompanyData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} hours`} content={<ChartTooltipContent />} />
                      <Legend />
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : ( <div className="text-center text-muted-foreground p-8"> <FileWarning className="w-16 h-16 mb-4 text-primary/30" /> <h3 className="font-headline text-lg text-primary">Not Enough Data</h3> <p>Track some time to see a breakdown by company.</p> </div> )}
             </CardContent>
           </Card>
           <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
             <CardHeader>
               <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                 <PieChart className="h-5 w-5" />
                 Hours by Project
               </CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col items-center justify-center h-80">
                {hoursByProjectData.length > 0 ? (
                  <ChartContainer config={{}} className="mx-auto aspect-square h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <Pie data={hoursByProjectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                         {hoursByProjectData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} hours`} content={<ChartTooltipContent />} />
                      <Legend />
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : ( <div className="text-center text-muted-foreground p-8"> <FileWarning className="w-16 h-16 mb-4 text-primary/30" /> <h3 className="font-headline text-lg text-primary">Not Enough Data</h3> <p>Track time on projects to see a breakdown.</p> </div> )}
             </CardContent>
           </Card>
      </div>

       <div className="grid gap-8 md:grid-cols-2">
        <div className="md:col-span-1">
            <WeeklyHoursChart />
        </div>
        <div className="md:col-span-1">
           <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
             <CardHeader>
               <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                 <PieChart className="h-5 w-5" />
                 Earnings by Company
               </CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col items-center justify-center h-80">
                {earningsByCompanyData.length > 0 ? (
                  <ChartContainer config={{}} className="mx-auto aspect-square h-full w-full" >
                    <ResponsiveContainer width="100%" height="100%">
                      <Pie data={earningsByCompanyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: $${value}`} >
                         {earningsByCompanyData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} content={<ChartTooltipContent />} />
                      <Legend />
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : ( <div className="text-center text-muted-foreground p-8"> <FileWarning className="w-16 h-16 mb-4 text-primary/30" /> <h3 className="font-headline text-lg text-primary">Not Enough Data</h3> <p>Track time for companies with hourly rates to see a breakdown.</p> </div> )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
