"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-provider';
import { db } from '@/lib/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters.' }),
});

type AddProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
};

export function AddProjectDialog({ open, onOpenChange, companyId }: AddProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a project.' });
      return;
    }
    
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        name: values.name,
        companyId: companyId || null,
        userId: user.uid,
        createdAt: Date.now(),
        isCompleted: false,
      });
      toast({ title: 'Success', description: 'Project added successfully.' });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding project: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add project.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Add New Project</DialogTitle>
          <DialogDescription>
            Add a new project. If a company is selected on the dashboard, this project will be associated with it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-headline text-primary/80">Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Phoenix" {...field} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="font-headline">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
