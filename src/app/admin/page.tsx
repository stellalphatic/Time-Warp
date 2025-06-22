
"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import { db } from "@/lib/firebase/client";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ ...doc.data(), uid: doc.id } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch user data. Check Firestore permissions." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleApproveUser = async (uid: string) => {
    setApproving(uid);
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        approved: true,
      });
      toast({
        title: "Success",
        description: "User has been approved.",
      });
    } catch (error: any) {
      console.error("Approval Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user. Check Firestore rules and permissions.",
      });
    } finally {
      setApproving(null);
    }
  };

  const pendingApprovalUsers = users.filter(user => !user.approved);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and application settings.</p>
      </div>

      <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">Pending Approvals</CardTitle>
          <CardDescription>Review and approve new user registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : pendingApprovalUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20 hover:bg-card/90">
                  <TableHead className="font-headline text-primary/80">Name</TableHead>
                  <TableHead className="font-headline text-primary/80">Email</TableHead>
                  <TableHead className="font-headline text-primary/80">Registered</TableHead>
                  <TableHead className="text-right font-headline text-primary/80">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovalUsers.map((user) => (
                  <TableRow key={user.uid} className="font-code border-primary/10 hover:bg-card/90">
                    <TableCell className="font-semibold">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.uid)}
                        disabled={approving === user.uid}
                      >
                        {approving === user.uid ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users are currently awaiting approval.</p>
          )}
        </CardContent>
      </Card>
       <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">All Users</CardTitle>
           <CardDescription>View all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            ): (
                 <Table>
                    <TableHeader>
                        <TableRow className="border-primary/20 hover:bg-card/90">
                        <TableHead className="font-headline text-primary/80">Name</TableHead>
                        <TableHead className="font-headline text-primary/80">Email</TableHead>
                        <TableHead className="font-headline text-primary/80">Status</TableHead>
                        <TableHead className="font-headline text-primary/80">Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                        <TableRow key={user.uid} className="font-code border-primary/10 hover:bg-card/90">
                            <TableCell className="font-semibold">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.approved ? "default" : "destructive"} className={user.approved ? 'bg-accent text-accent-foreground' : ''}>
                                    {user.approved ? "Approved" : "Pending"}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                <Badge variant={user.isAdmin ? "secondary" : "outline"}>
                                    {user.isAdmin ? "Admin" : "User"}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
