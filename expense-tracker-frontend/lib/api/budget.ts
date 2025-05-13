import { Budget } from "@/types/finance";
import Cookies from "js-cookie";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finance-fusion-api.vercel.app/api' || 'https://localhost:5000/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function to get headers with auth token
const getHeaders = () => {
  const token = Cookies.get('token');
  if (!token) {
    throw new Error("No authentication token found");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export async function getBudgets(): Promise<Budget[]> {
  try {
    const response = await fetch(`${API_URL}/dashboard/budgets`, {
      credentials: "include",
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        Cookies.remove('token');
        window.location.href = '/login';
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to fetch budgets");
    }
    
    const data = await response.json();
    return data.map((budget: any) => ({
      id: budget._id,
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      spent: 0, // This will be calculated in the component
    }));
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
}

export async function createBudget(budget: Omit<Budget, "id" | "spent">): Promise<Budget> {
  try {
    // Ensure the category is one of the allowed values
    const allowedCategories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Utilities",
      "Housing",
      "Healthcare",
      "Education",
      "Shopping",
      "Travel",
      "Other"
    ];
    let category = budget.category;
    
    // If the category is not in the allowed list, map it to "Other"
    if (!allowedCategories.includes(category)) {
      console.warn(`Category "${category}" is not in the allowed list. Mapping to "Other".`);
      category = "Other";
    }
    
    // Capitalize the first letter of the period
    const period = budget.period.charAt(0).toUpperCase() + budget.period.slice(1);
    
    const response = await fetch(`${API_URL}/dashboard/budgets`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify({
        category,
        amount: budget.amount,
        period,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        Cookies.remove('token');
        window.location.href = '/login';
        throw new Error("Session expired. Please log in again.");
      }
      
      // Try to get more detailed error information
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create budget");
    }
    
    const data = await response.json();
    return {
      id: data._id,
      category: data.category,
      amount: data.amount,
      spent: data.spent || 0, // Default to 0 if not provided
      period: data.period.toLowerCase() as 'weekly' | 'monthly' | 'yearly',
    };
  } catch (error) {
    console.error("Error creating budget:", error);
    throw error;
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    if (!id) {
      throw new Error("Budget ID is required for deletion");
    }

    const response = await fetch(`${API_URL}/dashboard/budgets/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        Cookies.remove('token');
        window.location.href = '/login';
        throw new Error("Session expired. Please log in again.");
      }
      if (response.status === 403) {
        throw new Error("You are not authorized to delete this budget");
      }
      throw new Error("Failed to delete budget");
    }
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
} 