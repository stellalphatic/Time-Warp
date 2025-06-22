"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase/client';
import { LogIn } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Sign in the user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Get the user's profile from Firestore to check their status
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await auth.signOut();
        throw new Error("User profile not found in database. Please sign up or contact support.");
      }
      
      const userProfile = userDoc.data() as UserProfile;

      // 3. Check if user is approved by an admin
      if (!userProfile.approved) {
        await auth.signOut();
        router.push('/pending-approval');
        // No toast needed here, the pending approval page explains the situation
        return; 
      }
      
      // 4. If approved, redirect to dashboard
      toast({
          title: 'Success',
          description: 'Logged in successfully! Redirecting...',
      });
      router.push('/');

    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/invalid-email':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                description = "Invalid email or password. Please check your credentials.";
                break;
            case 'auth/user-disabled':
                description = "This account has been disabled by an administrator.";
                break;
            case 'auth/too-many-requests':
                description = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later."
                break;
            default:
                description = error.message || "An unknown error occurred.";
                break;
        }

        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">
            LOGIN
          </CardTitle>
          <CardDescription>Access your Time Warp Tracker account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@timewarp.dev" {...field} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]" disabled={isLoading}>
                {isLoading ? 'Warping in...' : 'Login'}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
