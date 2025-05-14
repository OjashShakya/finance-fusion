import { Income, IncomeCategory } from "@/types/finance";
import Cookies from "js-cookie";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finance-fusion-api.vercel.app/api' || 'https://localhost:5000/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://finance-fusion-api.vercel.app/api";

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

export async function getIncomes(): Promise<Income[]> {
  try {
    const response = await fetch(`${API_URL}/dashboard/incomes`, {
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
      throw new Error("Failed to fetch incomes");
    }
    
    const data = await response.json();
    return data.map((income: any) => ({
      id: income._id,
      category: income.category as IncomeCategory,
      amount: income.amount,
      description: income.description,
      date: new Date(income.date),
    }));
  } catch (error) {
    console.error("Error fetching incomes:", error);
    throw error;
  }
}

export async function createIncome(income: Omit<Income, "id">): Promise<Income> {
  try {
    const response = await fetch(`${API_URL}/dashboard/incomes`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(income),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        Cookies.remove('token');
        window.location.href = '/login';
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to create income");
    }
    
    const data = await response.json();
    return {
      id: data._id,
      category: data.category as IncomeCategory,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
    };
  } catch (error) {
    console.error("Error creating income:", error);
    throw error;
  }
}

export async function deleteIncome(id: string): Promise<void> {
  try {
    if (!id) {
      throw new Error("Income ID is required for deletion");
    }

    const response = await fetch(`${API_URL}/dashboard/incomes/${id}`, {
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
        throw new Error("You are not authorized to delete this income");
      }
      throw new Error("Failed to delete income");
    }
  } catch (error) {
    console.error("Error deleting income:", error);
    throw error;
  }
}

export async function deleteAllIncomes(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/dashboard/incomes`, {
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
      throw new Error("Failed to delete all incomes");
    }
  } catch (error) {
    console.error("Error deleting all incomes:", error);
    throw error;
  }
} 