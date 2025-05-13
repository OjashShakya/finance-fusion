import { Expense } from "@/types/finance";
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

export async function getExpenses(): Promise<Expense[]> {
  try {
    const response = await fetch(`${API_URL}/dashboard/expenses`, {
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
      throw new Error("Failed to fetch expenses");
    }
    
    const data = await response.json();
    return data.map((expense: any) => ({
      id: expense._id,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: new Date(expense.date),
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

export async function createExpense(expense: Omit<Expense, "id">): Promise<Expense> {
  try {
    const response = await fetch(`${API_URL}/dashboard/expenses`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(expense),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        Cookies.remove('token');
        window.location.href = '/login';
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to create expense");
    }
    
    const data = await response.json();
    return {
      id: data._id,
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
    };
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    if (!id) {
      throw new Error("Expense ID is required for deletion");
    }

    const response = await fetch(`${API_URL}/dashboard/expenses/${id}`, {
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
        // Get the detailed error message from the response
        const errorData = await response.json();
        throw new Error(errorData.message || "You are not authorized to delete this expense");
      }
      throw new Error("Failed to delete expense");
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

export async function deleteAllExpenses(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/dashboard/expenses`, {
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
      throw new Error("Failed to delete all expenses");
    }
  } catch (error) {
    console.error("Error deleting all expenses:", error);
    throw error;
  }
} 