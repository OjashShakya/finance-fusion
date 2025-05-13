import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, LogOut, User as UserIcon, Eye, EyeOff, Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { savingsApi } from "@/lib/api/savings";
import { profileAPI } from "@/lib/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  amount: number;
  category: string;
  date: string;
}

interface Budget {
  amount: number;
  category: string;
  created_at: string;
}

interface SavingsGoal {
  initial_amount: number;
  target_amount: number;
  created_at: string;
  id: string;
}

interface Income {
  amount: number;
}

export default function SettingsView() {
  const { user, logout, sendPasswordResetEmail, setUser } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'privacy' | 'profile'>('achievements');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [newUsername, setNewUsername] = useState(user?.fullname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAchievements() {
      setLoading(true);
      try {
        const savingsGoals = await savingsApi.getAllSavings();
        const expenses: Expense[] = [{ amount: 100, category: 'Food', date: new Date().toISOString() }, { amount: 200, category: 'Transport', date: new Date().toISOString() }]; // Replace with real fetch
        const budgets: Budget[] = [{ amount: 1000, category: 'Food', created_at: new Date().toISOString() }]; // Replace with real fetch
        const incomes: Income[] = [{ amount: 0 }]; // Replace with real fetch
        const achs = [];
        if (user) achs.push({ title: "Welcome! First Login", value: 1, max: 1 });
        if (expenses.length > 0) achs.push({ title: "Logged your first expense", value: 1, max: 1 });
        if (budgets.length > 0) achs.push({ title: "Created your first budget", value: 1, max: 1 });
        if (savingsGoals.length > 0) achs.push({ title: "Created your first savings goal!", value: 1, max: 1 });
        
        // Savings achievements
        const completedGoals = savingsGoals.filter(g => g.initial_amount >= g.target_amount);
        if (completedGoals.length > 0) achs.push({ title: `Completed ${completedGoals.length} savings goal${completedGoals.length > 1 ? 's' : ''}!`, value: completedGoals.length, max: savingsGoals.length });
        if (savingsGoals.some(g => g.initial_amount >= 10000)) achs.push({ title: "Saved Rs 10,000 in a goal!", value: 10000, max: 10000 });
        if (savingsGoals.some(g => g.initial_amount >= 50000)) achs.push({ title: "Saved Rs 50,000 in a goal!", value: 50000, max: 50000 });
        if (savingsGoals.some(g => g.initial_amount >= 100000)) achs.push({ title: "Saved Rs 1,00,000 in a goal!", value: 100000, max: 100000 });
        if (savingsGoals.some(g => g.initial_amount >= 500000)) achs.push({ title: "Saved Rs 5,00,000 in a goal!", value: 500000, max: 500000 });
        if (savingsGoals.some(g => g.initial_amount >= 1000000)) achs.push({ title: "Saved Rs 10,00,000 in a goal!", value: 1000000, max: 1000000 });
        
        // Track monthly data
        const monthlyData = new Map(); // Track all monthly data
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentMonthKey = `${currentYear}-${currentMonth}`;

        // Initialize monthly data structure
        expenses.forEach(expense => {
          const date = new Date(expense.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              expenses: 0,
              impulseSpending: 0,
              savings: 0,
              budgets: 0
            });
          }
          
          const monthData = monthlyData.get(monthKey);
          monthData.expenses += expense.amount;
          
          // Track impulse spending (assuming expenses without category are impulse)
          if (!expense.category) {
            monthData.impulseSpending++;
          }
        });

        // Track savings by month
        savingsGoals.forEach(goal => {
          const date = new Date(goal.date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              expenses: 0,
              impulseSpending: 0,
              savings: 0,
              budgets: 0
            });
          }
          
          monthlyData.get(monthKey).savings += goal.initial_amount;
        });

        // Track budgets by month
        budgets.forEach(budget => {
          const date = new Date(budget.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              expenses: 0,
              impulseSpending: 0,
              savings: 0,
              budgets: 0
            });
          }
          
          monthlyData.get(monthKey).budgets++;
        });

        // Check consecutive months achievements
        const months = Array.from(monthlyData.keys()).sort();
        let consecutiveSavingsMonths = 0;
        let consecutiveBudgetMonths = 0;
        let consecutiveUnderBudgetMonths = 0;
        let consecutiveLowExpenseMonths = 0;
        let consecutiveNoImpulseMonths = 0;
        let currentStreak = 0;

        for (let i = 0; i < months.length; i++) {
          const month = months[i];
          const monthData = monthlyData.get(month);

          // Track consecutive savings months
          if (monthData.savings > 0) {
            currentStreak++;
            consecutiveSavingsMonths = Math.max(consecutiveSavingsMonths, currentStreak);
          } else {
            currentStreak = 0;
          }

          // Track consecutive budget months
          if (monthData.budgets > 0) {
            consecutiveBudgetMonths++;
          }

          // Track consecutive under budget months
          if (monthData.expenses <= 5000) {
            consecutiveLowExpenseMonths++;
          }

          // Track consecutive no impulse spending months
          if (monthData.impulseSpending === 0) {
            consecutiveNoImpulseMonths++;
          }

          // Track consecutive under budget months
          const underBudget = monthData.expenses <= (monthData.budgets * 1000); // Assuming average budget of 1000
          if (underBudget) {
            consecutiveUnderBudgetMonths++;
          }
        }

        // Add consecutive months achievements
        if (consecutiveSavingsMonths >= 6) achs.push({ title: "Saved for 6 consecutive months!", value: 6, max: 6 });
        if (consecutiveSavingsMonths >= 3) achs.push({ title: "Saved Rs 10,000 for 3 straight months!", value: 3, max: 3 });
        if (consecutiveLowExpenseMonths >= 1) achs.push({ title: "Spent less than Rs 5,000 in a month!", value: 5000, max: 5000 });
        if (consecutiveNoImpulseMonths >= 1) achs.push({ title: "No impulse spending for a full month!", value: 30, max: 30 });
        if (consecutiveBudgetMonths >= 6) achs.push({ title: "Created budgets for 6 straight months!", value: 6, max: 6 });
        if (consecutiveUnderBudgetMonths >= 3) achs.push({ title: "Stayed under budget for 3 months in a row!", value: 3, max: 3 });

        // Category-wise budget achievement
        const uniqueBudgetCategories = new Set(budgets.map(b => b.category));
        if (uniqueBudgetCategories.size > 0) achs.push({ title: "Created your first category-wise budget!", value: 1, max: 1 });

        // Income and savings ratio achievements
        const currentMonthData = monthlyData.get(currentMonthKey) || { expenses: 0, savings: 0, budgets: 0 };
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

        // Calculate savings percentage
        const savingsPercentage = totalIncome > 0 ? (currentMonthData.savings / totalIncome) * 100 : 0;
        if (savingsPercentage >= 20) achs.push({ title: "Saved 20% of your income this month!", value: Math.round(savingsPercentage), max: 20 });
        if (savingsPercentage >= 100) achs.push({ title: "Saved more than your monthly income!", value: Math.round(savingsPercentage), max: 100 });

        // Calculate month-over-month savings increase
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const previousMonthKey = `${previousYear}-${previousMonth}`;
        const previousMonthData = monthlyData.get(previousMonthKey) || { expenses: 0, savings: 0 };
        
        const savingsIncrease = previousMonthData.savings > 0 
          ? ((currentMonthData.savings - previousMonthData.savings) / previousMonthData.savings) * 100 
          : 0;
        
        if (savingsIncrease >= 50) achs.push({ title: "Increased your savings by 50% compared to last month!", value: Math.round(savingsIncrease), max: 100 });

        // Calculate expense reduction
        const expenseReduction = previousMonthData.expenses > 0 
          ? ((previousMonthData.expenses - currentMonthData.expenses) / previousMonthData.expenses) * 100 
          : 0;
        
        if (expenseReduction >= 25) achs.push({ title: "Cut your monthly expenses by 25%!", value: Math.round(expenseReduction), max: 25 });

        // Monthly Consistency Achievements
        if (currentMonthData.expenses >= 5) achs.push({ title: "Tracked 5 expenses this month", value: currentMonthData.expenses, max: 5 });
        if (currentMonthData.expenses >= 10) achs.push({ title: "Tracked 10 expenses this month", value: currentMonthData.expenses, max: 10 });

        // Budget achievements
        const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
        if (totalBudgetAmount >= 10000) achs.push({ title: "Set a monthly budget of Rs 10,000", value: totalBudgetAmount, max: 10000 });
        if (totalBudgetAmount >= 50000) achs.push({ title: "Set a monthly budget of Rs 50,000", value: totalBudgetAmount, max: 50000 });
        if (totalBudgetAmount >= 100000) achs.push({ title: "Set a monthly budget of Rs 1,00,000", value: totalBudgetAmount, max: 100000 });
        if (budgets.length >= 3) achs.push({ title: "Created 3 different budgets", value: budgets.length, max: 3 });
        if (budgets.length >= 5) achs.push({ title: "Created 5 different budgets", value: budgets.length, max: 5 });
        if (budgets.length >= 10) achs.push({ title: "Created 10 different budgets", value: budgets.length, max: 10 });
        
        // Expense achievements
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        if (totalExpenses >= 10000) achs.push({ title: "Tracked Rs 10,000 in expenses", value: totalExpenses, max: 10000 });
        if (totalExpenses >= 50000) achs.push({ title: "Tracked Rs 50,000 in expenses", value: totalExpenses, max: 50000 });
        if (totalExpenses >= 100000) achs.push({ title: "Tracked Rs 1,00,000 in expenses", value: totalExpenses, max: 100000 });
        if (expenses.length >= 10) achs.push({ title: "Tracked 10 expenses", value: expenses.length, max: 10 });
        if (expenses.length >= 50) achs.push({ title: "Tracked 50 expenses", value: expenses.length, max: 50 });
        if (expenses.length >= 100) achs.push({ title: "Tracked 100 expenses", value: expenses.length, max: 100 });
        
        // Income achievements
        if (totalIncome >= 10000) achs.push({ title: "Tracked Rs 10,000 in income", value: totalIncome, max: 10000 });
        if (totalIncome >= 50000) achs.push({ title: "Tracked Rs 50,000 in income", value: totalIncome, max: 50000 });
        if (totalIncome >= 100000) achs.push({ title: "Tracked Rs 1,00,000 in income", value: totalIncome, max: 100000 });
        if (incomes.length >= 5) achs.push({ title: "Tracked 5 income sources", value: incomes.length, max: 5 });
        if (incomes.length >= 10) achs.push({ title: "Tracked 10 income sources", value: incomes.length, max: 10 });
        
        // Financial health achievements
        const savingsToExpenseRatio = totalExpenses > 0 ? (savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0) / totalExpenses) : 0;
        if (savingsToExpenseRatio >= 0.5) achs.push({ title: "Saved 50% of your expenses", value: Math.round(savingsToExpenseRatio * 100), max: 50 });
        if (savingsToExpenseRatio >= 1) achs.push({ title: "Saved more than your expenses", value: Math.round(savingsToExpenseRatio * 100), max: 100 });
        if (savingsToExpenseRatio >= 2) achs.push({ title: "Saved double your expenses", value: Math.round(savingsToExpenseRatio * 100), max: 200 });
        
        // Goal completion achievements
        if (completedGoals.length === savingsGoals.length && savingsGoals.length > 0) achs.push({ title: "Completed all savings goals", value: 1, max: 1 });
        if (savingsGoals.length >= 5) achs.push({ title: "Created 5 savings goals", value: savingsGoals.length, max: 5 });
        if (savingsGoals.length >= 10) achs.push({ title: "Created 10 savings goals", value: savingsGoals.length, max: 10 });
        
        // New Category Achievements
        const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Travel'];
        const uniqueCategories = new Set(expenses.map(e => e.category));
        if (uniqueCategories.size >= 3) achs.push({ title: "Tracked expenses in 3 categories", value: uniqueCategories.size, max: 3 });
        if (uniqueCategories.size >= 5) achs.push({ title: "Tracked expenses in 5 categories", value: uniqueCategories.size, max: 5 });
        if (uniqueCategories.size >= 8) achs.push({ title: "Tracked expenses in all categories", value: uniqueCategories.size, max: 8 });
        
        // Budget Management Achievements
        const underBudget = budgets.filter(b => {
          const categoryExpenses = expenses.filter(e => e.category === b.category);
          const totalCategoryExpense = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          return totalCategoryExpense <= b.amount;
        });
        if (underBudget.length >= 3) achs.push({ title: "Stayed under budget in 3 categories", value: underBudget.length, max: 3 });
        if (underBudget.length >= 5) achs.push({ title: "Stayed under budget in 5 categories", value: underBudget.length, max: 5 });
        
        setAchievements(achs);
      } catch (e) {
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, [user]);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await profileAPI.updateUsername(user.id, newUsername);

      if (response.success) {
        toast({
          title: "Success",
          description: "Username updated successfully",
          variant: "default",
        });
        // Update local user state
        if (user) {
          user.fullname = newUsername;
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update username",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "Error",
        description: "Password must include at least one number and one special character (@, #, $, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await profileAPI.updatePassword(user.id, currentPassword, newPassword);

      if (response.success) {
        toast({
          title: "Success",
          description: "Password updated successfully",
          variant: "default",
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Modified error for incorrect current password
        const errorMsg = response.message?.toLowerCase().includes('incorrect') 
          ? 'Incorrect current password'
          : response.message || 'Failed to update password';

        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase().includes('incorrect') 
        ? 'Incorrect current password'
        : error.message || 'Failed to update password';

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !e.target.files?.length) return;

    const file = e.target.files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPG, PNG, GIF and SVG files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Create a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const sanitizedFileName = `profile-${timestamp}-${randomString}.${fileExtension}`;
    
    const sanitizedFile = new File(
      [file],
      sanitizedFileName,
      { type: file.type }
    );

    setIsUpdating(true);
    try {
      const response = await profileAPI.uploadProfilePicture(user.id, sanitizedFile);

      if (response.success) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
          variant: "default",
        });
        // Update local user state
        if (user) {
          user.profilePicture = response.data.data.profilePicture;
          setUser({ ...user }); // Trigger a re-render with the updated user
        }
      } else {
        console.error('Profile picture upload failed:', response.message);
        toast({
          title: "Error",
          description: response.message || "Failed to update profile picture",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const result = await profileAPI.removeProfilePicture(user.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Profile picture removed successfully",
          variant: "default",
        });
        // Update local state with empty profile picture
        setUser(user ? {
          ...user,
          profilePicture: { public_id: '', url: '' }
        } : null);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to remove profile picture",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 h-[calc(100vh-100px)] bg-[#f9f9f9] dark:bg-[#131313] flex flex-col items-center w-full">
      <div className="w-full mx-auto">
        {/* Profile/Settings Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-0 mb-8 w-full">
          {/* Left: Avatar, Name, Email */}
          <div className="flex items-center gap-6">
            <Avatar className="h-28 w-28 border border-[#e2e8f0] dark:border-[#4e4e4e]">
              <AvatarImage src={user?.profilePicture?.url || "/assets/profile-placeholder.png"} alt={user?.fullname || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-5xl">{user?.fullname?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{user?.fullname || "Username"}</div>
              <div className="text-lg text-gray-500 dark:text-[#b0b0b0]">{user?.email || "user@gmail.com"}</div>
            </div>
          </div>
          {/* Right: Profile, Settings, Logout (icons) */}
          <div className="flex flex-row gap-4 items-center justify-end mt-6 md:mt-0">
            <Button className="bg-transparent border hover:bg-transparent rounded-xl p-0 h-12 w-[140px] flex items-center justify-center border-gray-300 dark:border-[#4e4e4e] gap-2" onClick={() => setActiveTab('profile')}>
              <UserIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              <span className="text-lg font-semibold text-gray-400 dark:text-gray-200">Profile</span>
            </Button>
            <Button className="bg-transparent border hover:bg-transparent rounded-xl p-0 h-12 w-[140px] flex items-center justify-center border-gray-300 dark:border-[#4e4e4e] gap-2" onClick={() => setActiveTab('privacy')}>
              <Settings className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              <span className="text-lg font-semibold text-gray-400 dark:text-gray-200">Settings</span>
            </Button>
            <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-destructive/30 rounded-xl p-0 h-12 w-[140px] flex items-center justify-center border-red-300 dark:border-destructive/80 text-red-500 hover:bg-destructive/90 hover:text-destructive-foreground dark:hover:bg-destructive/80 gap-2" onClick={() => setShowLogout(true)}>
                  <LogOut className="h-6 w-6" />
                  <span className="text-lg font-semibold">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>This will end your current session.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={logout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {/* Section Content */}
        {activeTab === 'achievements' && (
          <div className="w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Achievements</h3>
            <div className="border-b border-[#e2e8f0] dark:border-[#4e4e4e] mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-3 text-center py-8 text-gray-400">Loading achievements...</div>
              ) : achievements.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-gray-400">No achievements yet. Start saving to unlock achievements!</div>
              ) : achievements.map((ach, idx) => (
                <Card key={idx} className="p-4 border border-[#e2e8f0] dark:border-[#4e4e4e] bg-transparent dark:bg-transparent flex flex-col justify-between">
                  <div className="font-semibold mb-2 text-[15px] text-gray-900 dark:text-white">{ach.title}</div>
                  {ach.max > 1 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 font-bold">{ach.value}</span>
                      <span className="text-gray-400 dark:text-gray-500">/ {ach.max}</span>
                    </div>
                  )}
                  {ach.max > 1 && <Progress value={(ach.value / ach.max) * 100} className="h-2 bg-gray-100 dark:bg-[#333] [&>div]:!bg-[#2ECC71]" />}
                  {ach.max === 1 && ach.value === 1 && <Progress value={100} className="h-2 bg-gray-100 dark:bg-[#333] [&>div]:!bg-[#2ECC71]" />}
                </Card>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'privacy' && (
          <div className="w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Settings</h3>
            <div className="border-b border-[#e2e8f0] dark:border-[#4e4e4e] mb-12" />
            <form className="max-w-2xl" onSubmit={handlePasswordUpdate}>
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="email">Email</label>
                <input id="email" type="email" className="flex-1 rounded-xl border border-gray-200 dark:border-[#4e4e4e] px-4 py-3 text-lg bg-white dark:bg-[#232323] text-gray-900 dark:text-white" value={user?.email || ''} disabled />
              </div>
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="currentPassword">Current Password</label>
                <div className="flex-1 relative">
                  <input 
                    id="currentPassword" 
                    type={showCurrentPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#4e4e4e] px-4 py-3 text-lg bg-white dark:bg-[#232323] text-gray-900 dark:text-white pr-12" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="newPassword">New Password</label>
                <div className="flex-1 relative">
                  <input 
                    id="newPassword" 
                    type={showNewPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#4e4e4e] px-4 py-3 text-lg bg-white dark:bg-[#232323] text-gray-900 dark:text-white pr-12" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="confirmPassword">Confirm Password</label>
                <div className="flex-1 relative">
                  <input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-gray-200 dark:border-[#4e4e4e] px-4 py-3 text-lg bg-white dark:bg-[#232323] text-gray-900 dark:text-white pr-12" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="bg-transparent rounded-xl px-10 py-3 text-gray-400 hover:text-gray-400 dark:text-gray-200 border-gray-300 dark:border-[#4e4e4e] font-semibold" onClick={() => setActiveTab('achievements')}>Back</Button>
                <Button type="submit" className="rounded-xl px-10 py-3 bg-[#27ae60] hover:bg-[#219150] text-white text-lg font-semibold" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile Settings</h3>
            <div className="border-b border-[#e2e8f0] dark:border-[#4e4e4e] mb-12" />
            <form className="max-w-2xl" onSubmit={handleUsernameUpdate}>
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="username">Username</label>
                <input 
                  id="username" 
                  type="text" 
                  className="flex-1 rounded-xl border border-gray-200 dark:border-[#4e4e4e] px-4 py-3 text-lg bg-white dark:bg-[#232323] text-gray-900 dark:text-white" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-lg font-semibold text-gray-900 dark:text-white w-32" htmlFor="avatar">Avatar</label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-[#e2e8f0] dark:border-[#4e4e4e]">
                    <AvatarImage src={user?.profilePicture?.url || "/assets/profile-placeholder.png"} alt={user?.fullname || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">{user?.fullname?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, Max size of 5MB<br />
                    <div className="flex gap-2 mt-1">
                      <label className="text-green-600 cursor-pointer hover:text-green-700">
                        Upload photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/svg+xml"
                          onChange={handleProfilePictureUpload}
                          disabled={isUpdating}
                        />
                      </label>
                      {/* {user?.profilePicture?.url && (
                        <button
                          type="button"
                          className="text-green-600 cursor-pointer hover:text-green-700"
                          onClick={handleRemoveProfilePicture}
                          disabled={isUpdating}
                        >
                          Remove photo
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="bg-transparent rounded-xl px-10 py-3 text-gray-400 hover:text-gray-400 dark:text-gray-200 border-gray-300 dark:border-[#4e4e4e] font-semibold" onClick={() => setActiveTab('achievements')}>Back</Button>
                <Button type="submit" className="rounded-xl px-10 py-3 bg-[#27ae60] hover:bg-[#219150] text-white text-lg font-semibold" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 