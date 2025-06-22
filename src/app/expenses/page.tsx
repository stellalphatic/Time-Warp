"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { FileWarning } from "lucide-react"

export default function ExpensesPage() {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const handleAddExpense = () => {
    // Logic to add expense will be implemented here
    toast({
      title: "In Development",
      description: "Functionality to add expenses is not yet implemented.",
    });
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">Expenses</h1>
        <p className="text-muted-foreground">Track your project-related expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
           <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
             <CardHeader>
               <CardTitle className="font-headline text-xl text-primary">ADD EXPENSE</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-headline text-primary/80">Description</Label>
                  <Textarea id="description" placeholder="e.g., Client dinner" value={description} onChange={(e) => setDescription(e.target.value)} className="font-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-headline text-primary/80">Amount ($)</Label>
                  <Input id="amount" type="number" placeholder="123.45" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-code" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="category" className="font-headline text-primary/80">Category</Label>
                  <Input id="category" placeholder="e.g., Software, Travel, etc." value={category} onChange={(e) => setCategory(e.target.value)} className="font-code" />
                </div>
                <Button className="w-full font-headline tracking-widest bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_hsl(var(--accent))]" onClick={handleAddExpense}>
                  Add Expense
                </Button>
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="border-primary/30 bg-card/80 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">RECENT EXPENSES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <FileWarning className="w-16 h-16 mb-4 text-primary/30" />
                <h3 className="font-headline text-xl text-primary">No Expenses Logged Yet</h3>
                <p>Add your first expense using the form on the left.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
