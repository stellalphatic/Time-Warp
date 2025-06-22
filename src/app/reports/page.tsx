import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Reports</h1>
        <p className="text-muted-foreground">Generate earnings and time reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-primary/30 bg-card/80 backdrop-blur-sm">
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
              <Select>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="Select report type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-log">Detailed Time Log</SelectItem>
                  <SelectItem value="earnings">Earnings Summary</SelectItem>
                  <SelectItem value="project-summary">Project Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="font-headline text-primary/80">Start Date</Label>
                  <Input type="date" className="font-code" />
                </div>
                <div className="space-y-2">
                  <Label className="font-headline text-primary/80">End Date</Label>
                  <Input type="date" className="font-code" />
                </div>
            </div>
             <div className="space-y-2">
              <Label className="font-headline text-primary/80">Filter by Company</Label>
              <Select>
                <SelectTrigger className="font-code">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="comp-a">Pixel Corp</SelectItem>
                  <SelectItem value="comp-b">SynthWave Inc.</SelectItem>
                  <SelectItem value="comp-c">Retro Gadgets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]">
              <Download className="mr-2 h-5 w-5" />
              Generate & Download
            </Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Card className="h-full border-primary/30 bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
              <FileText className="h-24 w-24 text-primary/20" />
              <h3 className="mt-4 text-xl font-headline text-primary">Your report will appear here</h3>
              <p className="mt-2 text-muted-foreground">
                Once you've selected your criteria and generated a report, you'll see a preview here.
              </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
