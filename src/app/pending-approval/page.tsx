"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass, LogOut } from 'lucide-react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Hourglass className="h-8 w-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />
          </div>
          <CardTitle className="mt-4 font-headline text-3xl text-primary">
            Approval Pending
          </CardTitle>
          <CardDescription className="text-lg">
            Your account is awaiting admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You will be able to log in once an administrator has approved your account.
            Please check back later or contact your system administrator.
          </p>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
