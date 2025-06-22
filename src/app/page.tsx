import { TimerCard } from '@/components/dashboard/timer-card';
import { LastSessionCard } from '@/components/dashboard/last-session-card';
import { WeeklyHoursChart } from '@/components/dashboard/weekly-hours-chart';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, get ready to warp time!</p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <TimerCard />
        </div>
        <div className="lg:col-span-2">
           <LastSessionCard />
        </div>
        <div className="lg:col-span-1">
            <WeeklyHoursChart />
        </div>
      </div>
    </div>
  );
}
