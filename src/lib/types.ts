export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  pin: string;
  approved: boolean;
  isAdmin: boolean;
  createdAt: number;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  hourlyRate?: number;
  currency: 'USD' | 'EUR' | 'PKR';
  createdAt: number;
}

export interface Project {
  id: string;
  userId: string;
  companyId: string | null;
  name: string;
  isCompleted: boolean;
  createdAt: number;
}

export interface Worklog {
  id: string;
  userId: string;
  companyId: string;
  projectId?: string | null;
  description?: string;
  startTime: number;
  endTime: number;
  status: 'running' | 'paused' | 'completed';
  // for pause tracking
  pauseStartTime?: number; // timestamp when pause began
  totalPausedTime: number; // in milliseconds
  // final calculation
  duration: number; // in seconds
  createdAt: number;
  source?: 'manual' | 'edited';
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  companyId?: string;
  projectId?: string;
  category: string;
  description: string;
  createdAt: number;
}

export interface ExpenseCategory {
  id:string;
  name: string;
}

export interface Payment {
  id: string;
  userId: string;
  companyId: string;
  amount: number;
  period: string; // e.g. "May 2025"
  createdAt: number;
}
