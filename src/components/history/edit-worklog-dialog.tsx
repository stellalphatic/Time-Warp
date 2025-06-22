"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-provider';
import { db } from '@/lib/firebase/client';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Worklog, Company, Project } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  companyId: z.string().min(1, "Company is required."),
  projectId: z.string().optional(),
  description: z.string().optional(),
});

type EditWorklogDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  worklog: Worklog | null;
  companies: Company[];
  projects: Project[];
};

export function EditWorklogDialog({ isOpen, setIsOpen, worklog, companies, projects }: EditWorklogDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isManualEntry = !worklog;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: isManualEntry ? new Date() : new Date(worklog!.startTime),
      startTime: isManualEntry ? '09:00' : format(new Date(worklog!.startTime), 'HH:mm'),
      endTime: isManualEntry ? '17:00' : format(new Date(worklog!.endTime), 'HH:mm'),
      companyId: worklog?.companyId || '',
      projectId: worklog?.projectId || '',
      description: worklog?.description || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: isManualEntry ? new Date() : new Date(worklog!.startTime),
        startTime: isManualEntry ? '09:00' : format(new Date(worklog!.startTime), 'HH:mm'),
        endTime: isManualEntry ? '17:00' : format(new Date(worklog!.endTime), 'HH:mm'),
        companyId: worklog?.companyId || '',
        projectId: worklog?.projectId || '',
        description: worklog?.description || '',
      });
    }
  }, [isOpen, worklog, isManualEntry, form]);
  
  const selectedCompanyId = form.watch("companyId");
  const filteredProjects = projects.filter(p => p.companyId === selectedCompanyId && !p.isCompleted);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    try {
      const startDateTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      const endDateTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);

      if (endDateTime <= startDateTime) {
        form.setError("endTime", { message: "End time must be after start time." });
        setIsLoading(false);
        return;
      }
      
      const durationInSeconds = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);

      const data: Partial<Worklog> = {
        userId: user.uid,
        companyId: values.companyId,
        projectId: values.projectId || null,
        description: values.description || '',
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        duration: durationInSeconds,
        status: 'completed',
        source: isManualEntry ? 'manual' : worklog?.source === 'manual' ? 'manual' : 'edited',
        totalPausedTime: isManualEntry ? 0 : worklog!.totalPausedTime,
      };

      if (isManualEntry) {
        await addDoc(collection(db, 'worklogs'), { ...data, createdAt: Date.now() });
        toast({ title: 'Success', description: 'Manual entry added.' });
      } else {
        await updateDoc(doc(db, 'worklogs', worklog!.id), data);
        toast({ title: 'Success', description: 'Work log updated.' });
      }
      
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error submitting worklog: ", error);
      toast({ variant: 'destructive', title: 'Error Saving Work Log', description: `Failed to save. ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">
            {isManualEntry ? 'Add Manual Entry' : 'Edit Work Log'}
          </DialogTitle>
          <DialogDescription>
            {isManualEntry ? 'Log time you forgot to track.' : 'Update the details of this time entry.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                    <div className="space-y-2">
                        <Label className="font-headline text-primary/80">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal font-code",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                         {form.formState.errors.date && <p className="text-sm font-medium text-destructive">{form.formState.errors.date.message}</p>}
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="startTime" className="font-headline text-primary/80">Start Time</Label>
                    <Input id="startTime" type="time" {...form.register('startTime')} className="font-code" />
                    {form.formState.errors.startTime && <p className="text-sm font-medium text-destructive">{form.formState.errors.startTime.message}</p>}
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="endTime" className="font-headline text-primary/80">End Time</Label>
                    <Input id="endTime" type="time" {...form.register('endTime')} className="font-code" />
                     {form.formState.errors.endTime && <p className="text-sm font-medium text-destructive">{form.formState.errors.endTime.message}</p>}
                 </div>
            </div>

            <div className="space-y-2">
                <Label className="font-headline text-primary/80">Company</Label>
                <Controller
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="font-code"><SelectValue placeholder="Select a company..." /></SelectTrigger>
                            <SelectContent>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {form.formState.errors.companyId && <p className="text-sm font-medium text-destructive">{form.formState.errors.companyId.message}</p>}
            </div>

            <div className="space-y-2">
                <Label className="font-headline text-primary/80">Project (Optional)</Label>
                <Controller
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''} >
                            <SelectTrigger className="font-code"><SelectValue placeholder="Select a project..." /></SelectTrigger>
                            <SelectContent>
                                {filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description" className="font-headline text-primary/80">Description (Optional)</Label>
                <Textarea id="description" {...form.register('description')} className="font-code" />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="font-headline w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isManualEntry ? 'Save Manual Entry' : 'Save Changes'}
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
