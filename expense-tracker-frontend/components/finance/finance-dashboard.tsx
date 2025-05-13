'use client';

import { useState, useEffect } from 'react';
import { FinanceSidebar } from '@/components/layout/finance-sidebar';
import { FinanceHeader } from '@/components/layout/finance-header';
import { DashboardView } from '@/components/finance/dashboard/dashboard-view';
import { ExpensesView } from '@/components/finance/expenses/expenses-view';
import { IncomeView } from '@/components/finance/income/income-view';
import { BudgetView } from '@/components/finance/budget/budget-view';
import { SavingsView } from '@/components/finance/savings/savings-view';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Expense, Income, Budget, SavingsGoal, SavingsTransaction } from '@/types/finance';
import { getIncomes, createIncome, deleteIncome, deleteAllIncomes } from '@/lib/api/income';
import { getExpenses, createExpense, deleteExpense } from '@/lib/api/expense';
import { savingsApi } from '@/lib/api/savings';
import { getBudgets, createBudget, deleteBudget } from '@/lib/api/budget';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import Cookies from 'js-cookie';
import SettingsView from './settings-view';

export function FinanceDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchIncomes();
      fetchSavingsGoals();
      fetchBudgets();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncomes = async () => {
    try {
      setIsLoading(true);
      const data = await getIncomes();
      setIncomes(data);
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      toast({
        title: "Error",
        description: "Failed to load incomes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavingsGoals = async () => {
    try {
      setIsLoading(true);
      const data = await savingsApi.getAllSavings();
      setSavingsGoals(data);
    } catch (error: any) {
      console.error('Error fetching savings goals:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load savings goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      setIsLoading(true);
      const data = await getBudgets();
      setBudgets(data);
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      toast({
        title: "Error",
        description: "Failed to load budgets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const newExpense = await createExpense(expense);
      setExpenses([...expenses, newExpense]);
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting expense:', error);
    
      // Provide a more user-friendly message for authorization errors
      if (error.message && error.message.includes("not authorized")) {
        toast({
          title: "Authorization Error",
          description: "You can only delete expenses that you created. This expense belongs to another user.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete expense. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    try {
      const newIncome = await createIncome(income);
      setIncomes(prev => [newIncome, ...prev]);
      toast({
        title: "Success",
        description: "Income added successfully",
      });
    } catch (error: any) {
      console.error('Error adding income:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add income. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteIncome(id);
      setIncomes(prev => prev.filter(income => income.id !== id));
      toast({
        title: "Success",
        description: "Income deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete income. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllIncomes = async () => {
    try {
      await deleteAllIncomes();
      setIncomes([]);
      toast({
        title: "Success",
        description: "All incomes deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting all incomes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete all incomes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'spent'>) => {
    try {
      const newBudget = await createBudget(budget);
      setBudgets((prev) => [...prev, newBudget]);
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((budget) => budget.id !== id));
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, "id">) => {
    try {
      console.log('Adding savings goal:', goal);

      // Validate required fields
      if (!goal.name?.trim()) {
        toast({
          title: "Error",
          description: "Goal name is required",
          variant: "destructive",
        });
        return;
      }
      if (isNaN(goal.target_amount) || goal.target_amount <= 0) {
        toast({
          title: "Error",
          description: "Target amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }
      if (isNaN(goal.initial_amount) || goal.initial_amount < 0) {
        toast({
          title: "Error",
          description: "Initial amount cannot be negative",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate names
      if (savingsGoals.some(g => g.name.toLowerCase() === goal.name.toLowerCase())) {
        toast({
          title: "Error",
          description: "A goal with this name already exists",
          variant: "destructive",
        });
        return;
      }

      // Validate initial amount is less than target amount
      if (goal.initial_amount >= goal.target_amount) {
        toast({
          title: "Error",
          description: "Initial amount must be less than target amount",
          variant: "destructive",
        });
        return;
      }

      // Validate date is in the future
      if (goal.date <= new Date()) {
        toast({
          title: "Error",
          description: "Target date must be in the future",
          variant: "destructive",
        });
        return;
      }

      const newGoal = await savingsApi.createSavings({
        name: goal.name.trim(),
        target_amount: Number(goal.target_amount),
        initial_amount: Number(goal.initial_amount),
        date: goal.date.toISOString(),
        color: goal.color || "#0088FE"
      });

      console.log('Created new savings goal:', newGoal);
      setSavingsGoals(prev => [...prev, newGoal]);
      toast({
        title: "Success",
        description: "Savings goal created successfully",
      });
    } catch (error: any) {
      console.error('Error creating savings goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create savings goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      // Get the savings goal to be deleted
      const goalToDelete = savingsGoals.find(goal => goal.id === id);
      if (!goalToDelete) {
        throw new Error("Savings goal not found");
      }

      // Delete the savings goal
      await savingsApi.deleteSavings(id);

      // Update the available income by adding back the initial amount
      const availableIncome = Cookies.get('availableIncome');
      const availableIncomeNum = Number(availableIncome || "0");
      const newAvailableIncome = availableIncomeNum + goalToDelete.initial_amount;
      Cookies.set('availableIncome', newAvailableIncome.toString());

      // Update the state
      setSavingsGoals(prev => prev.filter(goal => goal.id !== id));
      
      toast({
        title: "Success",
        description: "Savings goal deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting savings goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete savings goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateSavingsGoal = async (id: string, amount: number) => {
    try {
      const goal = savingsGoals.find(g => g.id === id);
      if (!goal) return;

      // Validate the amount
      if (amount <= 0) {
        toast({
          title: "Error",
          description: "Amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      const newAmount = goal.initial_amount + amount;
      if (newAmount > goal.target_amount) {
        toast({
          title: "Error",
          description: "Amount exceeds target amount",
          variant: "destructive",
        });
        return;
      }

      // Update the savings goal with the new total amount
      await savingsApi.updateSavings(id, { amount: newAmount });
      
      // Create a new savings transaction with just the contribution amount
      const newTransaction: SavingsTransaction = {
        id: crypto.randomUUID(),
        goalId: id,
        goalName: goal.name,
        amount: amount, // This is the contribution amount, not the total
        date: new Date(),
        type: 'savings'
      };

      setSavingsTransactions(prev => [newTransaction, ...prev]);
      await fetchSavingsGoals();

      toast({
        title: "Success",
        description: `Added Rs. ${amount.toFixed(2)} to ${goal.name}`,
      });
    } catch (error) {
      console.error('Error updating savings goal:', error);
      toast({
        title: "Error",
        description: "Failed to update savings goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            expenses={expenses}
            incomes={incomes}
            budgets={budgets}
            savingsGoals={savingsGoals}
            savingsTransactions={savingsTransactions}
            updateSavingsGoal={updateSavingsGoal}
            setActiveView={setActiveView}
            addExpense={addExpense}
            addIncome={addIncome}
            deleteSavingsGoal={deleteSavingsGoal}
          />
        );
      case 'expenses':
        return <ExpensesView 
          expenses={expenses} 
          onAdd={addExpense} 
          onDelete={handleDeleteExpense} 
          onExpensesChange={fetchExpenses}
        />;
      case 'income':
        return <IncomeView incomes={incomes} onAdd={addIncome} onDelete={handleDeleteIncome} onDeleteAll={handleDeleteAllIncomes} />;
      case 'budgeting':
        return (
          <BudgetView
            budgets={budgets}
            expenses={expenses}
            onAdd={addBudget}
            onDelete={handleDeleteBudget}
          />
        );
      case 'savings':
        return (
          <SavingsView
            goals={savingsGoals}
            onAdd={addSavingsGoal}
            onUpdate={updateSavingsGoal}
            onDelete={deleteSavingsGoal}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            expenses={expenses}
            incomes={incomes}
            budgets={budgets}
            savingsGoals={savingsGoals}
            savingsTransactions={savingsTransactions}
            updateSavingsGoal={updateSavingsGoal}
            setActiveView={setActiveView}
            addExpense={addExpense}
            addIncome={addIncome}
            deleteSavingsGoal={deleteSavingsGoal}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <FinanceSidebar 
          activeView={activeView} 
          setActiveView={setActiveView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <div className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[320px]'}`}>
          <FinanceHeader 
            activeView={activeView} 
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            setActiveView={setActiveView}
          />
          <main className="p-4 md:p-6 w-full mt-[80px]">{renderView()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
} 