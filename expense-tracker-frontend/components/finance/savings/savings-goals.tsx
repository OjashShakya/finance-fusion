"use client"

import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon, Check, Trash2 , AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { SavingsGoal } from "@/types/finance"
import { SAVINGS_COLORS } from "@/lib/constants"
import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import Cookies from "js-cookie"

interface SavingsGoalsProps {
  goals: SavingsGoal[]
  onAdd: (goal: Omit<SavingsGoal, "id">) => void
  onUpdate: (id: string, amount: number) => void
  onDelete: (id: string) => void
}

export function SavingsGoals({ goals, onAdd, onUpdate, onDelete }: SavingsGoalsProps) {
  const { toast } = useToast()
  const form = useForm<Omit<SavingsGoal, "id">>({
    defaultValues: {
      name: "",
      target_amount: 0,
      initial_amount: 0,
      date: new Date(),
      color: SAVINGS_COLORS[0],
    },
    mode: "onChange",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)

  function handleSubmit(data: Omit<SavingsGoal, "id">) {
    const availableIncome = Cookies.get('availableIncome')
    const availableIncomeNum = Number(availableIncome || "0")
    const target = Number(data.target_amount);
    const initial = Number(data.initial_amount);
    // Validate name
    if (!data.name.trim()) {
      toast({
        title: "Error",
        description: "Goal name is required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names
    if (goals.some(goal => goal.name.toLowerCase() === data.name.toLowerCase())) {
      toast({
        title: "Error",
        description: "A goal with this name already exists",
        variant: "destructive",
      });
      return;
    }

    // Validate numbers
   
    if (isNaN(target) || target <= 0) {
      toast({
        title: "Error",
        description: "Target amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(initial) || initial < 0) {
      toast({
        title: "Error",
        description: "Initial amount cannot be negative",
        variant: "destructive",
      });
      return;
    }
      if (initial > availableIncomeNum) {
      toast({
        title: "Add Your Income",
        description: "Initial amount cannot be greater than the income available",
        variant: "destructive",
      });
      return;
    } 
    if (initial > target) {
      toast({
        title: "Error",
        description: "Initial amount must be less than target amount",
        variant: "destructive",
      });
      return;
    }
    // Validate initial amount is less than target amount

    // Validate date is in the future
    if (data.date <= new Date()) {
      toast({
        title: "Error",
        description: "Target date must be in the future",
        variant: "destructive",
      });
      return;
    }

    onAdd(data)
    toast({
      title: "Savings goal created",
      description: `${data.name}: Rs. ${data.target_amount} by ${format(data.date, "MMM d, yyyy")}`,
      variant: "success",
    })
    form.reset({
      name: "",
      target_amount: 0,
      initial_amount: 0,
      date: new Date(),
      color: SAVINGS_COLORS[Math.floor(Math.random() * SAVINGS_COLORS.length)],
    })
  }

  const handleContribution = (goalId: string, amount: string) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const newAmount = Number.parseFloat(amount || "0")
    if (isNaN(newAmount)) return

    // Check if goal is already at 100%
    const currentPercentage = (goal.initial_amount / goal.target_amount) * 100

    if(newAmount == 0 || newAmount < 0){
      toast({
        title: "Please Enter valid amount",
        description: "You cannot add Rs 0 or negative amount",
        variant: "destructive",
        duration: 3000,
      })
    }
    if (currentPercentage >= 100) {
      toast({
        title: "Goal Completed",
        description: `You have already reached your savings goal for ${goal.name}.`,
        variant: "success",
        duration: 5000,
      })
      return
    }

    // Check if user has enough available income
    const availableIncome = Cookies.get('availableIncome')
    const availableIncomeNum = Number(availableIncome || "0")
    
    if (!availableIncome || availableIncomeNum <= 0) {
      toast({
        title: "Saving Failed",
        description: "You don't have enough available income to save. Please add income first.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check if contribution amount is greater than available income
    if (newAmount > availableIncomeNum) {
      toast({
        title: "Saving Failed",
        description: `You can only save up to Rs. ${availableIncomeNum.toFixed(2)} as you cannot save more than your remaining income`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check if contribution amount exceeds remaining amount
    const remaining = goal.target_amount - goal.initial_amount;
    if (newAmount > remaining) {
      toast({
        title: "Saving Failed",
        description: `You cannot add more than the remaining amount (Rs. ${remaining.toFixed(2)}). Please enter a smaller amount.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    onUpdate(goalId, newAmount)

    // Update available income in localStorage
    const newAvailableIncome = availableIncomeNum - newAmount
    Cookies.set('availableIncome', newAvailableIncome.toString())

    const input = document.getElementById(`contribution-${goalId}`) as HTMLInputElement
    if (input) input.value = ""

    const newTotal = goal.initial_amount + newAmount
    const newPercentage = (newTotal / goal.target_amount) * 100
    const newRemaining = goal.target_amount - newTotal

    // Check if goal is now complete
    if (newPercentage >= 100) {
      toast({
        title: "Congratulations! 🎉",
        description: (
          <div className="mt-2">
            <p>You have successfully reached your savings goal for {goal.name}!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Total Saved: Rs. {newTotal.toFixed(2)}
            </p>
          </div>
        ),
        variant: "success",
        duration: 7000,
      })
    } else {
      if(newAmount == 0 || newAmount < 0){
        toast({
          title: "Please Enter valid amount",
          description: "You cannot add Rs 0 or negative amount",
          variant: "destructive",
          duration: 3000,
        })
      }else{
        toast({
          title: "Amount Saved Successfully",
          description: (
            <div className="mt-2">
              <p>Added Rs. {newAmount.toFixed(2)} to {goal.name}</p>
              <p className="text-sm text-muted-foreground">
                Progress: {newPercentage.toFixed(1)}% ({newTotal.toFixed(2)} / {goal.target_amount.toFixed(2)})
              </p>
              <p className="text-sm text-muted-foreground">
                Remaining: Rs. {newRemaining.toFixed(2)}
              </p>
            </div>
          ),
          variant: "success",
          duration: 5000,
        })
      }
    }
  }

  const handleDeleteClick = (goalId: string) => {
    setGoalToDelete(goalId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (goalToDelete) {
      onDelete(goalToDelete)
      setDeleteDialogOpen(false)
      setGoalToDelete(null)
    }
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Your Goals</TabsTrigger>
        <TabsTrigger value="add">Create Goal</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-4 pt-4">
        {goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              if (!goal || typeof goal.initial_amount !== 'number' || typeof goal.target_amount !== 'number') {
                console.error('Invalid goal data:', goal);
                return null;
              }

              const percentage = (goal.initial_amount / goal.target_amount) * 100;
              const remaining = goal.target_amount - goal.initial_amount;
              const targetDate = format(goal.date, "MMM d, yyyy");
              const isComplete = percentage >= 100;

              return (
                <Card key={goal.id} className="bg-[#f9f9f9] dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">{goal.name}</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-[#4e4e4e]">
                          Target: Rs. {goal.target_amount.toFixed(2)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(goal.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {isComplete ? "Goal Completed! 🎉" : `Rs. ${remaining.toFixed(2)} Remaining`}
                        </span>
                        <Badge variant={percentage >= 90 ? "destructive" : percentage >= 75 ? "outline" : "secondary"}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress
                        value={percentage}
                        className={`h-2 ${
                          percentage >= 90
                            ? "!bg-red-100 dark:!bg-red-900/20"
                            : percentage >= 75
                              ? "!bg-amber-500/20 dark:!bg-amber-900/20"
                              : "!bg-[#e8f5e9] dark:!bg-green-900/20"
                        }`}
                        indicatorClassName={`${
                          percentage >= 90
                            ? "!bg-red-500"
                            : percentage >= 75
                              ? "!bg-amber-500"
                              : "!bg-[#27ae60]"
                        }`}
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-[#4e4e4e]">Remaining</span>
                        <span className="text-gray-900 dark:text-white">Rs. {remaining.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-[#4e4e4e]">Target Date</span>
                        <span className="text-gray-900 dark:text-white">{targetDate}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full gap-2">
                      <Input
                        id={`contribution-${goal.id}`}
                        type="number"
                        placeholder="Enter amount"
                        className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e] text-gray-900 dark:text-white"
                        disabled={isComplete}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById(`contribution-${goal.id}`) as HTMLInputElement
                          handleContribution(goal.id, input.value)
                        }}
                        className="bg-[#27ae60] hover:bg-[#2ecc71] dark:bg-[#27ae60] dark:hover:bg-[#2ecc71] text-white"
                      >
                        {isComplete ? "Completed" : "Add"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No savings goals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a goal to start saving</p>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="add" className="space-y-4 pt-4">
        <Card className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Create New Savings Goal</CardTitle>
            <CardDescription className="text-gray-500 dark:text-[#4e4e4e]">
              Set a target amount and date for your savings goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900 dark:text-white">Goal Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., New Car" 
                          {...field} 
                          className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e] text-gray-900 dark:text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1 relative group w-fit">
                        <FormLabel className="text-gray-900 dark:text-white">
                          Target Amount
                        </FormLabel>

                        {/* Alert Icon with tooltip-like hover */}
                        <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-pointer" />

                        {/* Hover message */}
                        <div className="absolute -top-7 left-full ml-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Enter your target savings
                        </div>
                      </div>

                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e] text-gray-900 dark:text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  <FormField
                    control={form.control}
                    name="initial_amount"
                    render={({ field }) => (
                      <FormItem>
                       <div className="flex items-center gap-1 relative group w-fit">
                        <FormLabel className="text-gray-900 dark:text-white">
                          Initial Amount
                        </FormLabel>

                        {/* Alert Icon with tooltip-like hover */}
                        <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-pointer" />

                        {/* Hover message */}
                        <div className="absolute -top-7 left-full ml-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Enter the amount you can save
                        </div>
                      </div>
                        
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            className="bg-white dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e] text-gray-900 dark:text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-900 dark:text-white">Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-[#f9f9f9] dark:bg-[#131313] border-[#e2e8f0] dark:border-[#4e4e4e] text-gray-900 dark:text-white",
                                !field.value && "text-gray-500 dark:text-[#4e4e4e]"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-[#27ae60] hover:bg-[#2ecc71] dark:bg-[#27ae60] dark:hover:bg-[#2ecc71] text-white"
                >
                  Create Goal
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your savings goal
              {goalToDelete && goals.find(g => g.id === goalToDelete) && ` "${goals.find(g => g.id === goalToDelete)?.name}"`}.
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
    </Tabs>
  )
}

