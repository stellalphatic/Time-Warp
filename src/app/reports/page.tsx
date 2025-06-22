"use client";

import { useState, useEffect, useMemo } from "react";
import type { Worklog, Company, Project } from "@/lib/types";
import { useAuth } from "@/context/auth-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { format, startOfDay, endOfDay } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as PieChartIcon, BarChart3, Download, FileText, Calendar as CalendarIcon, Loader2, FileWarning } from "lucide-react";
import { Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Augment jsPDF interface for autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const formatDuration = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// --- ReportPreview Component ---
const ReportPreview = ({ reportData, reportType, companies, projects }: { reportData: any[], reportType: string, companies: Company[], projects: Project[] }) => {
    const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';
    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
    const getCompany = (companyId: string) => companies.find(c => c.id === companyId);

    if (reportData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <FileWarning className="w-16 h-16 mb-4 text-primary/30" />
                <h3 className="font-headline text-xl text-primary">No Data Found</h3>
                <p>No work logs match your selected criteria. Please adjust the filters and try again.</p>
            </div>
        )
    }

    switch(reportType) {
        case 'earnings-summary':
            const chartData = reportData.map(item => ({ name: item.companyName, value: item.earnings }));
            return (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="text-right">Earnings</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map(item => (
                                    <TableRow key={item.companyId}>
                                        <TableCell className="font-semibold">{item.companyName}</TableCell>
                                        <TableCell className="text-right font-code">{item.totalHours.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-code text-accent font-bold">{formatCurrency(item.earnings, item.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="lg:col-span-2 flex flex-col items-center justify-center">
                         <ChartContainer config={{}} className="mx-auto aspect-square h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${formatCurrency(value as number, 'USD')}`} content={<ChartTooltipContent />} />
                            <Legend />
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            )
        case 'project-summary':
            return (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map(item => (
                            <TableRow key={item.projectId}>
                                <TableCell className="font-semibold">{item.projectName}</TableCell>
                                <TableCell><Badge variant="secondary">{item.companyName}</Badge></TableCell>
                                <TableCell className="text-right font-code">{item.totalHours.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )
        case 'time-log':
        default:
            return (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{format(log.endTime, "yyyy-MM-dd")}</TableCell>
                                <TableCell>{getCompanyName(log.companyId)}</TableCell>
                                <TableCell>{log.projectId ? getProjectName(log.projectId) : 'N/A'}</TableCell>
                                <TableCell className="font-code">{formatDuration(log.duration)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )
    }
}


export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCompany, setSelectedCompany] = useState("all");
  
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const worklogsQuery = query(collection(db, "worklogs"), where("userId", "==", user.uid));
    const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid));
    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubWorklogs = onSnapshot(worklogsQuery, (snapshot) => {
        setWorklogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worklog)));
        if(loading) setLoading(false);
    });
    const unsubCompanies = onSnapshot(companiesQuery, (snapshot) => setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company))));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project))));
    
    return () => { unsubWorklogs(); unsubCompanies(); unsubProjects(); };
  }, [user, loading]);

  const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'N/A';
  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
  const getCompany = (companyId: string) => companies.find(c => c.id === companyId);

  const generatePdf = (data: any[], type: string, start: Date, end: Date) => {
    const doc = new jsPDF();
    const title = type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report for period: ${format(start, "yyyy-MM-dd")} to ${format(end, "yyyy-MM-dd")}`, 14, 28);
    if(selectedCompany !== 'all') {
        doc.text(`Company: ${getCompanyName(selectedCompany)}`, 14, 34);
    }
    
    let head, body;
    switch(type) {
        case 'earnings-summary':
            head = [['Company', 'Total Hours', 'Estimated Earnings']];
            body = data.map(item => [item.companyName, item.totalHours.toFixed(2), formatCurrency(item.earnings, item.currency)]);
            break;
        case 'project-summary':
            head = [['Project', 'Company', 'Total Hours']];
            body = data.map(item => [item.projectName, item.companyName, item.totalHours.toFixed(2)]);
            break;
        case 'time-log':
        default:
            head = [['Date', 'Company', 'Project', 'Description', 'Duration (H:M)']];
            body = data.map(log => [
                format(log.endTime, "yyyy-MM-dd"),
                getCompanyName(log.companyId),
                log.projectId ? getProjectName(log.projectId) : 'N/A',
                log.description || '',
                formatDuration(log.duration)
            ]);
    }
    
    autoTable(doc, {
        startY: 40,
        head: head,
        body: body,
        headStyles: { fillColor: [190, 41, 236] }, // Primary color
        theme: 'striped',
    });
    
    doc.save(`TimeWarp_Report_${type}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const handleGenerateReport = () => {
    if (!reportType || !startDate || !endDate) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select a report type and date range." });
      return;
    }
    setGenerating(true);

    const filteredLogs = worklogs.filter(log => {
      const logDate = log.endTime;
      const isInDateRange = logDate >= startOfDay(startDate).getTime() && logDate <= endOfDay(endDate).getTime();
      const companyMatch = selectedCompany === 'all' || log.companyId === selectedCompany;
      return log.status === 'completed' && isInDateRange && companyMatch;
    });

    if (filteredLogs.length === 0) {
        setReportData([]);
        setGenerating(false);
        return;
    }

    let processedData;
    switch (reportType) {
        case 'earnings-summary':
            const earningsMap = new Map();
            filteredLogs.forEach(log => {
                const company = getCompany(log.companyId);
                if (!company) return;
                const entry = earningsMap.get(log.companyId) || { companyName: company.name, totalHours: 0, earnings: 0, currency: company.currency };
                const hours = log.duration / 3600;
                entry.totalHours += hours;
                if(company.hourlyRate) {
                    entry.earnings += hours * company.hourlyRate;
                }
                earningsMap.set(log.companyId, entry);
            });
            processedData = Array.from(earningsMap.values());
            break;
        case 'project-summary':
             const projectsMap = new Map();
             filteredLogs.forEach(log => {
                if(!log.projectId) return;
                const entry = projectsMap.get(log.projectId) || { projectId: log.projectId, projectName: getProjectName(log.projectId), companyName: getCompanyName(log.companyId), totalHours: 0 };
                entry.totalHours += log.duration / 3600;
                projectsMap.set(log.projectId, entry);
             });
             processedData = Array.from(projectsMap.values());
             break;
        case 'time-log':
        default:
            processedData = filteredLogs.sort((a,b) => a.endTime - b.endTime);
            break;
    }
    setReportData(processedData);
    generatePdf(processedData, reportType, startDate, endDate);
    setGenerating(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Reports</h1>
        <p className="text-muted-foreground">Generate earnings and time reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-primary/30 bg-card/80 backdrop-blur-sm h-fit">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                GENERATE REPORT
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Select your criteria below to generate a new report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="font-headline text-primary/80">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="Select report type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-log">Detailed Time Log</SelectItem>
                  <SelectItem value="earnings-summary">Earnings Summary</SelectItem>
                  <SelectItem value="project-summary">Project Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="font-headline text-primary/80">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-code", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="font-headline text-primary/80">End Date</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal font-code", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                  </Popover>
                </div>
            </div>
             <div className="space-y-2">
              <Label className="font-headline text-primary/80">Filter by Company</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={loading}>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]" onClick={handleGenerateReport} disabled={generating || loading}>
                {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                {generating ? 'Generating...' : 'Generate & Download'}
            </Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
            <Card className="h-full border-primary/30 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">
                        {reportData ? 'Report Preview' : 'Your report will appear here'}
                    </CardTitle>
                    <CardDescription>
                        {reportData ? `Preview for ${reportType.replace(/-/g, ' ')}` : "Once you've selected your criteria and generated a report, you'll see a preview here."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reportData === null ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                            <FileText className="h-24 w-24 text-primary/20" />
                            <p className="mt-2">Select your criteria to generate a report.</p>
                        </div>
                    ) : (
                        <ReportPreview reportData={reportData} reportType={reportType} companies={companies} projects={projects} />
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
