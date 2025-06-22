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
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Company name must be at least 2 characters.' }),
  hourlyRate: z.coerce.number().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'PKR']),
});

type AddCompanyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddCompanyDialog({ open, onOpenChange }: AddCompanyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      hourlyRate: 0,
      currency: 'EUR',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add a company.' });
      return;
    }
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'companies'), {
        ...values,
        userId: user.uid,
        createdAt: Date.now(),
      });
      toast({ title: 'Success', description: 'Company added successfully.' });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding company: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add company.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Add New Company</DialogTitle>
          <DialogDescription>
            Add a new client or company to track your time against.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-headline text-primary/80">Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pixel Corp" {...field} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Hourly Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="35.00" {...field} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-code">
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="font-headline">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Company
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
