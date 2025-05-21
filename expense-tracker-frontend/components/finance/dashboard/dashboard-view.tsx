"use client"

import { useState, useEffect } from "react"
import { RecentTransactions } from "./recent-transactions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Expense, Income, Budget, SavingsGoal, SavingsTransaction } from "@/types/finance"
import { CashFlowChart } from "./charts/cash-flow-chart"
import { useAuth } from "@/src/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus, BarChart, Banknote, ChartPie, Wallet, Sun, Repeat2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/finance/expenses/expense-form"
import { IncomeForm } from "@/components/finance/income/income-form"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ExpenseDistributionChart } from "./charts/expense-distribution-chart"
import { IncomeSourcesChart } from "./charts/income-sources-chart"
import { MonthlyComparisonChart } from "./charts/monthly-comparison-chart"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { SavingsGoalsList } from "./savings-goals-list"
import { BudgetProgress } from "./budget-progress"
import Cookies from "js-cookie"

interface DashboardViewProps {
  expenses: Expense[]
  incomes: Income[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
  savingsTransactions: SavingsTransaction[]
  updateSavingsGoal: (id: string, amount: number) => void
  setActiveView: (view: string) => void
  addExpense: (expense: Omit<Expense, "id">) => void
  addIncome: (income: Omit<Income, "id">) => void
  deleteSavingsGoal: (id: string) => void
}

interface CashFlowData {
  name: string
  income: number
  expenses: number
  balance: number
}

interface MonthlyData {
  name: string
  income: number
  expenses: number
}

interface IncomeData {
  name: string
  value: number
}

interface ExpenseData {
  name: string
  value: number
}

export function DashboardView({
  expenses,
  incomes,
  budgets,
  savingsGoals,
  savingsTransactions,
  updateSavingsGoal,
  setActiveView,
  addExpense,
  addIncome,
  deleteSavingsGoal,
}: DashboardViewProps) {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("Good morning")
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [showTotalIncome, setShowTotalIncome] = useState(false)
  const [showTotalSavings, setShowTotalSavings] = useState(false)

  // Calculate totals
  const totalSavings = savingsGoals.reduce((sum, goal) => sum + (goal.initial_amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const totalIncome = incomes.reduce((sum, income) => sum + (income.amount || 0), 0)
  const availableIncome = totalIncome - totalSavings - totalExpenses
  const netIncome = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((totalSavings ) / totalIncome) * 100 : 0

  // Update localStorage with available income
  useEffect(() => {
    Cookies.set('availableIncome', availableIncome.toString())
  }, [availableIncome])

  // Get current month's data
  const today = new Date()
  const startOfCurrentMonth = startOfMonth(today)
  const endOfCurrentMonth = endOfMonth(today)
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth })

  // Process data for charts
  const cashFlowData: CashFlowData[] = daysInMonth.map(day => {
    const dayExpenses = expenses.filter(expense => 
      expense.date && format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).reduce((sum, expense) => sum + (expense.amount || 0), 0)

    const dayIncomes = incomes.filter(income => 
      income.date && format(new Date(income.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).reduce((sum, income) => sum + (income.amount || 0), 0)

    return {
      name: format(day, 'MMM dd'),
      expenses: dayExpenses,
      income: dayIncomes,
      balance: dayIncomes - dayExpenses
    }
  })

  const monthlyComparisonData: MonthlyData[] = daysInMonth.map(day => {
    const dayExpenses = expenses.filter(expense => 
      expense.date && format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).reduce((sum, expense) => sum + (expense.amount || 0), 0)

    const dayIncomes = incomes.filter(income => 
      income.date && format(new Date(income.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).reduce((sum, income) => sum + (income.amount || 0), 0)

    return {
      name: format(day, 'MMM dd'),
      expenses: dayExpenses,
      income: dayIncomes
    }
  })

  const expenseDistributionData: ExpenseData[] = Object.entries(
    expenses.reduce((acc, expense) => {
      if (!expense.category) return acc
      acc[expense.category] = (acc[expense.category] || 0) + (expense.amount || 0)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const incomeSourcesData: IncomeData[] = Object.entries(
    incomes.reduce((acc, income) => {
      if (!income.category) return acc
      acc[income.category] = (acc[income.category] || 0) + (income.amount || 0)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Update greeting based on time of day
  useEffect(() => {
    const currentHour = new Date().getHours()
    let newGreeting = "Good morning"
    if (currentHour >= 12 && currentHour < 18) {
      newGreeting = "Good afternoon"
    } else if (currentHour >= 18) {
      newGreeting = "Good evening"
    }
    setGreeting(newGreeting)
  }, [])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[32px] font-semibold tracking-tight text-gray-900 dark:text-white">
            {greeting}, {user?.fullname || "Username"}!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Welcome to dashboard. Here's an overview of your finance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Income Card */}
        <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">
                {showTotalIncome ? "Total Income" : "Available Income"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTotalIncome(!showTotalIncome)}
                className="h-8 w-8 text-gray-500 hover:text-primary dark:text-gray-400"
              >
                <Repeat2 className="h-4 w-4" />
                <span className="sr-only">Toggle view</span>
              </Button>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Rs. {showTotalIncome ? totalIncome.toFixed(2) : availableIncome.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {showTotalIncome ? "Total earnings" : `${incomes.length} income sources`}
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] px-4 py-4">
            <h4 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
              <BarChart className="h-5 w-5" />
              Add Income
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record a new income</p>
            <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-3 w-full gap-2 bg-[#27ae60] hover:bg-[#2ecc71] dark:bg-[#27ae60] dark:hover:bg-[#2ecc71]">
                  <Plus className="h-4 w-4" /> Add Income
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[24px] border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] p-0">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Add Income</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                      Track and manage your income
                    </DialogDescription>
                  </div>
                  <IncomeForm
                    onSubmit={async (data) => {
                      await addIncome(data)
                      setIncomeDialogOpen(false)
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Expense Card */}
        <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">Total Expenses</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Rs. {totalExpenses}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{expenses.length} transactions</p>
          </div>
          <div className="border-t border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] px-4 py-4">
            <h4 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
              <Banknote className="h-5 w-5" />
              Add Expense
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Record a new expense</p>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-3 bg-[#f9f9f9] dark:bg-[#131313] w-full gap-2 border border-gray-200 dark:border-[#4e4e4e]" variant="outline">
                  <Plus className="h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[24px] border-gray-200 dark:border-[#4e4e4e] bg-white dark:bg-[#131313] p-0">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Add Expense</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                      Track and manage your expenses
                    </DialogDescription>
                  </div>
                  <ExpenseForm
                    onSubmit={(data) => {
                      addExpense(data)
                      setExpenseDialogOpen(false)
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Net Income Card */}
        <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">Net Income</h3>
            <p className={cn(
              "mt-2 text-3xl font-bold",
              netIncome >= 0 ? "text-[#10B981]" : "text-red-500"
            )}>
              Rs. {Math.abs(netIncome).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {netIncome >= 0 ? "Positive cash flow" : "Negative cash flow"}
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] px-4 py-4">
            <h4 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
              <ChartPie className="h-5 w-5" />
              Mange Budgets
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set and track budgets</p>
            <Button 
              variant="outline" 
              className="mt-3 bg-[#f9f9f9] dark:bg-[#131313] w-full gap-2 border border-gray-200 dark:border-[#4e4e4e]" 
              onClick={() => setActiveView("budgeting")}
            >
              <ChartPie className="h-4 w-4" /> View Budgets
            </Button>
          </div>
        </Card>

        {/* Savings Card */}
        <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">
                {showTotalSavings ? "Total Savings" : "Saving Rate"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTotalSavings(!showTotalSavings)}
                className="h-8 w-8 text-gray-500 hover:text-primary dark:text-gray-400"
              >
                <Repeat2 className="h-4 w-4" />
                <span className="sr-only">Toggle view</span>
              </Button>
            </div>
            {showTotalSavings ? (
              <>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Rs. {totalSavings.toFixed(2)}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {savingsGoals.length} savings goals
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{savingsRate.toFixed(2)}%</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {savingsRate >= 20 ? "Excellent saving habits" : 
                   savingsRate >= 10 ? "Good saving habits" :
                   savingsRate >= 0 ? "Could save more" :
                   "Spending more than earning"}
                </p>
              </>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] px-4 py-4">
            <h4 className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-white">
              <Wallet className="h-5 w-5" />
              Savings Goals
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your savings goals</p>
            <Button 
              variant="outline" 
              className="mt-3 bg-[#f9f9f9] dark:bg-[#131313] w-full gap-2 border border-gray-200 dark:border-[#4e4e4e]" 
              onClick={() => setActiveView("savings")}
            >
              <Wallet className="h-4 w-4" /> View Goals
            </Button>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Section 1: Cash Flow Chart and Recent Transactions side by side */}
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Cash Flow</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your daily income and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowChart data={cashFlowData} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions 
                expenses={expenses} 
                incomes={incomes} 
                savingsTransactions={savingsTransactions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Monthly Comparison */}
        <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Monthly Comparison</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Compare your income and expenses this month</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyComparisonChart data={monthlyComparisonData} />
          </CardContent>
        </Card>

        {/* Section 3: Income Sources and Expense Distribution side by side */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Income Sources</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Breakdown of your income by category</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeSourcesChart data={incomeSourcesData} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Expense Distribution</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Breakdown of your expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseDistributionChart data={expenseDistributionData} />
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Savings Goals and Budget Progress side by side */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Savings Goals</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Track your progress towards financial goals</CardDescription>
            </CardHeader>
            <CardContent>
              <SavingsGoalsList 
                goals={savingsGoals} 
                updateSavingsGoal={updateSavingsGoal} 
                setActiveView={setActiveView}
                onDelete={deleteSavingsGoal}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[16px] border border-gray-200 dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Budget Progress</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Monitor your spending against budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetProgress budgets={budgets} expenses={expenses} setActiveView={setActiveView} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

