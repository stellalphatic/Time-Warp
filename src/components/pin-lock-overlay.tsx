"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { usePinLock } from '@/context/pin-lock-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  pin: z.string().length(4, { message: 'PIN must be 4 digits.' }),
});

export function PinLockOverlay() {
  const { isLocked, verifyPin } = usePinLock();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { pin: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const isCorrect = await verifyPin(values.pin);
    if (!isCorrect) {
      toast({
        variant: 'destructive',
        title: 'Incorrect PIN',
        description: 'Please try again.',
      });
      form.reset();
    }
    setIsLoading(false);
  };

  if (!isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm p-4 text-center">
        <ShieldCheck className="mx-auto h-16 w-16 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />
        <h2 className="mt-4 font-headline text-3xl font-bold text-primary">Session Locked</h2>
        <p className="mt-2 text-muted-foreground">For your security, please re-enter your PIN.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      maxLength={4}
                      autoFocus
                      placeholder="••••"
                      className="font-code text-center text-2xl h-14 tracking-[1em]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Unlock'}
              <ShieldOff className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
