import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, LogOut, User as UserIcon, Eye, EyeOff, Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { savingsApi } from "@/lib/api/savings";
import { profileAPI } from "@/lib/api";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { getExpenses } from "@/lib/api/expense";
import { getBudgets } from "@/lib/api/budget";
import { getIncomes } from "@/lib/api/income";
import type { Expense } from "@/types/finance";
import type { Budget } from "@/types/finance";
import type { Income } from "@/types/finance";
import type { SavingsGoal } from "@/types/finance";

// Add this interface at the top of the file after imports
interface Achievement {
  title: string;
  value: number;
  max: number;
  category: 'basic' | 'expense' | 'income' | 'savings' | 'budget' | 'category' | 'financial';
  description: string;
}

//deploy
export default function SettingsView() {
  const { user, logout, sendPasswordResetEmail, setUser } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
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
        const expenses: Expense[] = await getExpenses();
        const budgets: Budget[] = await getBudgets();
        const incomes: Income[] = await getIncomes();
        
        // Define all possible achievements
        const allAchievements: Achievement[] = [
          // Basic Achievements
          {
            title: "First Login",
            value: user ? 1 : 0,
            max: 1,
            category: 'basic',
            description: "Welcome to FinanceFusion!"
          },
          {
            title: "First Expense",
            value: expenses.length > 0 ? 1 : 0,
            max: 1,
            category: 'basic',
            description: "Track your first expense"
          },
          {
            title: "First Budget",
            value: budgets.length > 0 ? 1 : 0,
            max: 1,
            category: 'basic',
            description: "Create your first budget"
          },
          {
            title: "First Savings Goal",
            value: savingsGoals.length > 0 ? 1 : 0,
            max: 1,
            category: 'basic',
            description: "Set your first savings goal"
          },
          {
            title: "First Income",
            value: incomes.length > 0 ? 1 : 0,
            max: 1,
            category: 'basic',
            description: "Track your first income"
          },

          // Expense Achievements
          {
            title: "Track 5 Expenses",
            value: expenses.length,
            max: 5,
            category: 'expense',
            description: "Track 5 expenses in a month"
          },
          {
            title: "Track 10 Expenses",
            value: expenses.length,
            max: 10,
            category: 'expense',
            description: "Track 10 expenses in a month"
          },
          {
            title: "Track 50 Expenses",
            value: expenses.length,
            max: 50,
            category: 'expense',
            description: "Track 50 expenses in a month"
          },
          {
            title: "Low Spender",
            value: expenses.reduce((sum, e) => sum + e.amount, 0),
            max: 5000,
            category: 'expense',
            description: "Spend less than Rs 5,000 in a month"
          },
          {
            title: "No Impulse Spending",
            value: expenses.filter(e => !e.description).length === 0 ? 1 : 0,
            max: 1,
            category: 'expense',
            description: "No impulse spending for a month"
          },

          // Income Achievements
          {
            title: "Track Rs 10,000 Income",
            value: incomes.reduce((sum, i) => sum + i.amount, 0),
            max: 10000,
            category: 'income',
            description: "Track Rs 10,000 in income"
          },
          {
            title: "Track Rs 50,000 Income",
            value: incomes.reduce((sum, i) => sum + i.amount, 0),
            max: 50000,
            category: 'income',
            description: "Track Rs 50,000 in income"
          },
          {
            title: "Track Rs 1,00,000 Income",
            value: incomes.reduce((sum, i) => sum + i.amount, 0),
            max: 100000,
            category: 'income',
            description: "Track Rs 1,00,000 in income"
          },
          {
            title: "Multiple Income Sources",
            value: new Set(incomes.map(i => i.category)).size,
            max: 5,
            category: 'income',
            description: "Track income from 5 different sources"
          },

          // Savings Achievements
          {
            title: "Save Rs 10,000",
            value: savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0),
            max: 10000,
            category: 'savings',
            description: "Save Rs 10,000 in goals"
          },
          {
            title: "Save Rs 50,000",
            value: savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0),
            max: 50000,
            category: 'savings',
            description: "Save Rs 50,000 in goals"
          },
          {
            title: "Save Rs 1,00,000",
            value: savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0),
            max: 100000,
            category: 'savings',
            description: "Save Rs 1,00,000 in goals"
          },
          {
            title: "Complete 3 Goals",
            value: savingsGoals.filter(g => g.initial_amount >= g.target_amount).length,
            max: 3,
            category: 'savings',
            description: "Complete 3 savings goals"
          },

          // Budget Achievements
          {
            title: "Create 3 Budgets",
            value: budgets.length,
            max: 3,
            category: 'budget',
            description: "Create 3 different budgets"
          },
          {
            title: "Create 5 Budgets",
            value: budgets.length,
            max: 5,
            category: 'budget',
            description: "Create 5 different budgets"
          },
          {
            title: "Stay Under Budget",
            value: budgets.filter(b => {
              const categoryExpenses = expenses.filter(e => e.category === b.category);
              const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
              return totalSpent <= b.amount;
            }).length,
            max: budgets.length || 1,
            category: 'budget',
            description: "Stay under budget in all categories"
          },

          // Category Achievements
          {
            title: "Track 3 Categories",
            value: new Set(expenses.map(e => e.category)).size,
            max: 3,
            category: 'category',
            description: "Track expenses in 3 categories"
          },
          {
            title: "Track 5 Categories",
            value: new Set(expenses.map(e => e.category)).size,
            max: 5,
            category: 'category',
            description: "Track expenses in 5 categories"
          },
          {
            title: "Track All Categories",
            value: new Set(expenses.map(e => e.category)).size,
            max: 8,
            category: 'category',
            description: "Track expenses in all categories"
          },

          // Financial Health Achievements
          {
            title: "Save 20% of Income",
            value: (() => {
              const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
              const totalSavings = savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0);
              return totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
            })(),
            max: 20,
            category: 'financial',
            description: "Save 20% of your income"
          },
          {
            title: "Save 50% of Income",
            value: (() => {
              const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
              const totalSavings = savingsGoals.reduce((sum, g) => sum + g.initial_amount, 0);
              return totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
            })(),
            max: 50,
            category: 'financial',
            description: "Save 50% of your income"
          },
          {
            title: "Positive Net Worth",
            value: (() => {
              const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
              const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
              return totalIncome - totalExpenses > 0 ? 1 : 0;
            })(),
            max: 1,
            category: 'financial',
            description: "Maintain positive net worth"
          }
        ];

        setAchievements(allAchievements);
      } catch (e) {
        console.error('Error fetching achievements:', e);
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
                <Button variant="outline" className="bg-destructive/10 rounded-xl p-0 h-12 w-[140px] flex items-center justify-center border-red-300 dark:border-destructive/80 text-red-500 hover:bg-destructive/90 hover:text-destructive-foreground dark:hover:bg-destructive/80 gap-2" onClick={() => setShowLogout(true)}>
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{ach.description}</div>
                  {ach.max > 1 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 font-bold">{ach.value}</span>
                      <span className="text-gray-400 dark:text-gray-500">/ {ach.max}</span>
                    </div>
                  )}
                  {ach.max > 1 && (
                    <Progress 
                      value={(ach.value / ach.max) * 100} 
                      className="h-2 bg-gray-100 dark:bg-[#333] [&>div]:!bg-[#2ECC71]" 
                    />
                  )}
                  {ach.max === 1 && ach.value === 1 && (
                    <Progress 
                      value={100} 
                      className="h-2 bg-gray-100 dark:bg-[#333] [&>div]:!bg-[#2ECC71]" 
                    />
                  )}
                  {ach.max === 1 && ach.value === 0 && (
                    <Progress 
                      value={0} 
                      className="h-2 bg-gray-100 dark:bg-[#333]" 
                    />
                  )}
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