import { SavingsGoal } from "@/types/finance";
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

export interface CreateSavingsGoalData {
  name: string;
  target_amount: number;
  initial_amount: number;
  date: string;
  color?: string;
}

export interface UpdateSavingsGoalData {
  amount: number;
  date?: string;
}

export const savingsApi = {
  // Get all savings goals
  getAllSavings: async (): Promise<SavingsGoal[]> => {
    try {
      const response = await fetch(`${API_URL}/dashboard/savings`, {
        credentials: "include",
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          window.location.href = '/login';
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not authorized to view these savings goals");
        }
        throw new Error("Failed to fetch savings goals");
      }
      
      const data = await response.json();
      return data.map((goal: any) => ({
        id: goal._id,
        name: goal.name,
        target_amount: Number(goal.target_amount),
        initial_amount: Number(goal.initial_amount),
        date: new Date(goal.date),
        color: goal.color || "#0088FE"
      }));
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      throw error;
    }
  },

  // Get a specific savings goal
  getSavingsById: async (id: string): Promise<SavingsGoal> => {
    try {
      const response = await fetch(`${API_URL}/dashboard/savings/${id}`, {
        credentials: "include",
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          window.location.href = '/login';
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not authorized to view this savings goal");
        }
        throw new Error("Failed to fetch savings goal");
      }
      
      const data = await response.json();
      return {
        id: data._id,
        name: data.name,
        target_amount: data.target_amount,
        initial_amount: data.initial_amount,
        date: new Date(data.date),
        color: data.color || '#0088FE'
      };
    } catch (error) {
      console.error("Error fetching savings goal:", error);
      throw error;
    }
  },

  // Create a new savings goal
  createSavings: async (data: CreateSavingsGoalData): Promise<SavingsGoal> => {
    try {
      // console.log('Creating savings goal with data:', data);
      
      const response = await fetch(`${API_URL}/dashboard/savings`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        
        if (response.status === 401) {
          Cookies.remove('token');
          window.location.href = '/login';
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not authorized to create savings goals");
        }
        throw new Error(errorData.message || "Failed to create savings goal");
      }
      
      const responseData = await response.json();
      // console.log('Create savings response:', responseData);
      
      return {
        id: responseData._id,
        name: responseData.name,
        target_amount: Number(responseData.target_amount),
        initial_amount: Number(responseData.initial_amount),
        date: new Date(responseData.date),
        color: responseData.color || '#0088FE'
      };
    } catch (error) {
      console.error("Error creating savings goal:", error);
      throw error;
    }
  },

  // Update a savings goal (add money)
  updateSavings: async (id: string, data: { amount: number; date?: Date }): Promise<SavingsGoal> => {
    try {
      const response = await fetch(`${API_URL}/dashboard/savings/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          window.location.href = '/login';
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not authorized to update this savings goal");
        }
        throw new Error("Failed to update savings goal");
      }
      
      const responseData = await response.json();
      // console.log('Update savings response:', responseData);
      
      return {
        id: responseData._id,
        name: responseData.name,
        target_amount: Number(responseData.target_amount),
        initial_amount: Number(responseData.initial_amount),
        date: new Date(responseData.date),
        color: responseData.color || '#0088FE'
      };
    } catch (error) {
      console.error("Error updating savings goal:", error);
      throw error;
    }
  },

  // Delete a savings goal
  deleteSavings: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/dashboard/savings/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('token');
          window.location.href = '/login';
          throw new Error("Session expired. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You are not authorized to delete this savings goal");
        }
        throw new Error("Failed to delete savings goal");
      }
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      throw error;
    }
  },
}; 