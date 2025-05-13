"use client"

import { useState } from "react"
import { Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { Budget, Expense } from "@/types/finance"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BudgetListProps {
  budgets: Budget[]
  expenses: Expense[]
  onDelete: (id: string) => void
}

export function BudgetList({ budgets, expenses, onDelete }: BudgetListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDelete(budgetId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (budgetToDelete) {
      onDelete(budgetToDelete)
      setDeleteDialogOpen(false)
      setBudgetToDelete(null)
    }
  }

  const handleShowBudgetStatus = (budget: Budget) => {
    const spent = expenses
      .filter(expense => expense.category === budget.category)
      .reduce((sum, expense) => sum + (expense.amount || 0), 0)
    
    const percentage = (spent / budget.amount) * 100
    const remaining = budget.amount - spent

    if (percentage >= 100) {
      toast({
        title: "Budget Exceeded",
        description: `You have exceeded your ${budget.category} budget by Rs. ${Math.abs(remaining).toFixed(2)}.`,
        variant: "destructive",
        duration: 3000,
      })
    } else {
      toast({
        title: "Budget Status",
        description: `Your ${budget.category} budget is at ${percentage.toFixed(0)}%. Rs. ${remaining.toFixed(2)} remaining.`,
        variant: "success",
        duration: 3000,
      })
    }
  }

  const filteredBudgets = budgets
    .filter((budget) => budget.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aSpent = expenses
        .filter(expense => expense.category === a.category)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const bSpent = expenses
        .filter(expense => expense.category === b.category)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const aPercentage = (aSpent / a.amount) * 100
      const bPercentage = (bSpent / b.amount) * 100
      return bPercentage - aPercentage
    })

  return (
    <div className="space-y-4">
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your budget for
              {budgetToDelete && budgets.find(b => b.id === budgetToDelete) && ` "${budgets.find(b => b.id === budgetToDelete)?.category}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative">
        <Input placeholder="Search budgets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {filteredBudgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((budget) => {
            const spent = expenses
              .filter(expense => expense.category === budget.category)
              .reduce((sum, expense) => sum + (expense.amount || 0), 0)
            const percentage = spent > budget.amount 
              ? -((spent - budget.amount) / budget.amount) * 100 
              : (spent / budget.amount) * 100
            const remaining = budget.amount - spent
            const isExceeded = percentage >= 100

            return (
              <Card key={budget.id} className="bg-[#f9f9f9] dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e]">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{budget.category}</CardTitle>
                      <CardDescription>
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${isExceeded ? 'text-destructive hover:text-destructive/80' : 'text-green-500 hover:text-green-600'}`}
                        onClick={() => handleShowBudgetStatus(budget)}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span className="sr-only">Show budget status</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(budget.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        ${spent.toFixed(2)} of ${budget.amount.toFixed(2)}
                      </span>
                      <Badge variant={percentage < 0 || percentage > 90 ? "destructive" : percentage > 75 ? "outline" : "secondary"}>
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress
                      value={Math.abs(percentage)}
                      className={`h-2 ${
                        percentage < 0
                          ? "!bg-red-500"
                          : percentage > 90
                            ? "!bg-red-100"
                            : percentage > 75
                              ? "!bg-amber-500/20"
                              : "!bg-[#e8f5e9]"
                      }`}
                      indicatorClassName={`${
                        percentage < 0
                          ? "!bg-black"
                          : percentage > 90
                            ? "!bg-red-500"
                            : percentage > 75
                              ? "!bg-amber-500"
                              : "!bg-[#27ae60]"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">Rs. {remaining.toFixed(2)} remaining</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No budgets found</p>
            {searchTerm && <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>}
          </div>
        </div>
      )}
    </div>
  )
}

