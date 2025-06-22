"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { db } from '@/lib/firebase/client';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import type { Company, Project } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, PlusCircle, Trash2, Sun, Moon, Loader2 } from "lucide-react";
import { useTheme } from '@/context/theme-provider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AddCompanyDialog } from '@/components/company/add-company-dialog';
import { AddProjectDialog } from '@/components/project/add-project-dialog';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const companiesQuery = query(collection(db, "companies"), where("userId", "==", user.uid));
    const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));

    const unsubCompanies = onSnapshot(companiesQuery, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(comps);
      if(loading) setLoading(false);
    });

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    return () => {
      unsubCompanies();
      unsubProjects();
    };
  }, [user, loading]);

  const handlePasswordChange = () => {
    toast({ title: "In Development", description: "Password change functionality is not yet implemented." });
  };
  
  const handlePinChange = () => {
    toast({ title: "In Development", description: "PIN change functionality is not yet implemented." });
  };

  const deleteCompany = async (companyId: string) => {
    if (window.confirm("Are you sure you want to delete this company and all its projects? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "companies", companyId));
        // Also delete associated projects
        const projectsToDelete = projects.filter(p => p.companyId === companyId);
        for (const project of projectsToDelete) {
          await deleteDoc(doc(db, "projects", project.id));
        }
        toast({ title: "Success", description: "Company deleted." });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete company." });
      }
    }
  };

  const handleToggleProjectComplete = async (projectId: string, isCompleted: boolean) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, { isCompleted: !isCompleted });
        toast({ title: "Success", description: `Project status updated.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not update project status." });
    }
  }

  const handleAddProjectClick = (companyId: string | null) => {
    setEditingCompanyId(companyId);
    setShowAddProjectDialog(true);
  }
  
  return (
    <div className="space-y-8">
      <AddCompanyDialog open={showAddCompanyDialog} onOpenChange={setShowAddCompanyDialog} />
      <AddProjectDialog open={showAddProjectDialog} onOpenChange={setShowAddProjectDialog} companyId={editingCompanyId} />

      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Settings</h1>
        <p className="text-muted-foreground">Manage your account, companies, and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 font-headline">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="companies">Companies & Projects</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">User Profile</CardTitle>
              <CardDescription>Update your personal information and theme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/50">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.uid}`} alt={userProfile?.name} />
                  <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-headline text-primary/80">Full Name</Label>
                  <Input id="name" defaultValue={userProfile?.name} className="font-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-headline text-primary/80">Email Address</Label>
                  <Input id="email" type="email" defaultValue={userProfile?.email} disabled className="font-code"/>
                </div>
              </div>
              <div className="space-y-4 rounded-lg border border-border p-4">
                <Label className="font-headline text-primary/80">Theme Settings</Label>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Toggle between Retro and Fire themes.</span>
                    <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        <Switch
                            checked={theme === 'theme-fire'}
                            onCheckedChange={toggleTheme}
                            aria-label="Toggle theme"
                        />
                        <Sun className="h-5 w-5" />
                    </div>
                </div>
              </div>
              <Button className="font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle className="font-headline text-xl text-primary">Companies & Projects</CardTitle>
                    <CardDescription>Manage your clients and their projects.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowAddCompanyDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Company
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : companies.map(company => (
                    <Card key={company.id} className="bg-card/50 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div>
                                <h4 className="font-headline text-lg text-primary">{company.name}</h4>
                                <p className="text-sm text-muted-foreground font-code">
                                    {company.hourlyRate ? `${company.currency} ${company.hourlyRate.toFixed(2)}/hr` : 'No rate set'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCompany(company.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                            <h5 className="mb-2 text-sm font-headline text-primary/80">Projects</h5>
                             {projects.filter(p => p.companyId === company.id).length > 0 ? (
                                <div className="space-y-2">
                                    {projects.filter(p => p.companyId === company.id).map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-2 rounded-md bg-black/20">
                                            <span className={`font-code text-sm ${project.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                                {project.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                 <Label htmlFor={`complete-switch-${project.id}`} className="text-xs text-muted-foreground">Done</Label>
                                                <Switch id={`complete-switch-${project.id}`} checked={project.isCompleted} onCheckedChange={() => handleToggleProjectComplete(project.id, project.isCompleted)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-muted-foreground">No projects for this company yet.</p>}
                            <Button variant="ghost" size="sm" className="text-accent text-xs" onClick={() => handleAddProjectClick(company.id)}>
                                <PlusCircle className="mr-1 h-3 w-3" />Add Project
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {!loading && (
                  <>
                    <Card className="bg-card/50 border-primary/20">
                      <CardHeader className="p-4">
                        <h4 className="font-headline text-lg text-primary">Independent Projects</h4>
                      </CardHeader>
                       <CardContent className="p-4 pt-0 space-y-3">
                         {projects.filter(p => !p.companyId).length > 0 ? (
                            <div className="space-y-2">
                                {projects.filter(p => !p.companyId).map(project => (
                                    <div key={project.id} className="flex items-center justify-between p-2 rounded-md bg-black/20">
                                        <span className={`font-code text-sm ${project.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                            {project.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                              <Label htmlFor={`complete-switch-${project.id}`} className="text-xs text-muted-foreground">Done</Label>
                                            <Switch id={`complete-switch-${project.id}`} checked={project.isCompleted} onCheckedChange={() => handleToggleProjectComplete(project.id, project.isCompleted)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-muted-foreground">No independent projects yet.</p>}
                        <Button variant="ghost" size="sm" className="text-accent text-xs" onClick={() => handleAddProjectClick(null)}>
                            <PlusCircle className="mr-1 h-3 w-3" />Add Independent Project
                        </Button>
                      </CardContent>
                    </Card>
                    {companies.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <p>You haven't added any companies yet.</p>
                        <Button variant="link" className="text-accent" onClick={() => setShowAddCompanyDialog(true)}>Add your first company</Button>
                      </div>
                    )}
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">Change Password</CardTitle>
                <CardDescription>Update your login password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-headline text-primary/80">Current Password</Label>
                    <Input type="password" className="font-code" />
                </div>
                 <div className="space-y-2">
                    <Label className="font-headline text-primary/80">New Password</Label>
                    <Input type="password" className="font-code" />
                </div>
                 <div className="space-y-2">
                    <Label className="font-headline text-primary/80">Confirm New Password</Label>
                    <Input type="password" className="font-code" />
                </div>
                <Button className="font-headline" onClick={handlePasswordChange}>Update Password</Button>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">Change PIN</CardTitle>
                <CardDescription>Update your 4-digit quick access PIN.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-headline text-primary/80">Current PIN</Label>
                    <Input type="password" maxLength={4} className="font-code" />
                </div>
                 <div className="space-y-2">
                    <Label className="font-headline text-primary/80">New PIN</Label>
                    <Input type="password" maxLength={4} className="font-code" />
                </div>
                 <div className="space-y-2">
                    <Label className="font-headline text-primary/80">Confirm New PIN</Label>
                    <Input type="password" maxLength={4} className="font-code" />
                </div>
                <Button className="font-headline" onClick={handlePinChange}>Update PIN</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
