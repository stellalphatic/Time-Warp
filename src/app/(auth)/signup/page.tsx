"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { auth, db } from '@/lib/firebase/client';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  pin: z.string().length(4, { message: 'PIN must be exactly 4 digits.' }).regex(/^\d{4}$/, { message: 'PIN must be numeric.' }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      pin: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: values.name,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        pin: values.pin,
        approved: false, // All new users are not approved by default
        isAdmin: false,
        createdAt: Date.now(),
      });

      toast({
        title: 'Account Created',
        description: "You've successfully signed up! An admin must approve your account before you can log in.",
      });
      router.push('/login');
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = "An account with this email address already exists.";
          break;
        case 'auth/invalid-email':
          description = "The email address you entered is not valid.";
          break;
        case 'auth/operation-not-allowed':
          description = "Email/password sign-up is not enabled in your Firebase project. Please enable it in the Firebase console.";
          break;
        case 'auth/weak-password':
          description = "The password is too weak. It must be at least 6 characters.";
          break;
        case 'permission-denied':
          description = "Could not save user data. This is likely due to Firestore security rules. Please ensure you have created a Firestore database and its rules allow writes to the 'users' collection.";
          break;
        default:
          description = `An error occurred. Please check your network connection and Firebase project setup. (Error: ${error.message})`;
          break;
      }

      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
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
            CREATE ACCOUNT
          </CardTitle>
          <CardDescription>Join the Time Warp. It's about time.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@timewarp.dev" {...field} className="font-code" />
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
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-headline text-primary/80">4-Digit PIN</FormLabel>
                    <FormControl>
                      <Input type="password" maxLength={4} placeholder="••••" {...field} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]"
                disabled={isLoading}
              >
                 {isLoading ? 'Creating Account...' : 'Sign Up'}
                 <UserPlus className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
