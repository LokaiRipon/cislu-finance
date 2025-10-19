// src/features/FinancialRecords/types.ts

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'mpesa' | 'bank' | 'cash' | 'paypal';

// This matches the TSelectTransaction from the backend schema (what you get back from GET /transactions)
export interface Transaction {
  id: number;
  type: TransactionType;
  sourceOrCategory: string; // Better than just 'description'
  amount: number; // Positive number (validated by backend)
  transactionCost?: number; // Optional extra cost (e.g., M-Pesa fees?)
  balanceAfter?: number; // Calculated by backend when creating/updating
  date: string; // ISO string (e.g., "2025-01-15T08:00:00Z")
  method: PaymentMethod;
  transactionCode?: string | null; // e.g., M-Pesa code
  payerOrPayee?: string | null; // Who paid or was paid to
  description?: string | null; // Additional details
  recordedBy?: number; // User ID who recorded it (if linked)
  meetingId?: number; // Link to a specific meeting (if applicable)
}

// This matches the TreasurerReport type from the backend service
export interface TreasurerReport {
  totalIncome: number;
  totalExpense: number;
  netBalance: number; // totalIncome - totalExpense (relative to opening balance for the period)
  openingBalance: number; // Balance at the start of the period
  closingBalance: number; // Balance at the end of the period
}

// Type for the response from GET /transactions (with pagination)
export interface ListTransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// Type for the request body to POST /transactions (what you send to create)
export interface CreateTransactionRequest {
  type: TransactionType;
  sourceOrCategory: string;
  amount: number;
  transactionCost?: number;
  date?: string; // Optional, backend defaults to now
  method: PaymentMethod;
  transactionCode?: string | null;
  payerOrPayee?: string | null;
  description?: string | null;
  meetingId?: number; // Optional link to meeting
  // 'balanceAfter' is calculated by backend, don't send
  // 'recordedBy' is likely set by backend based on JWT, don't send
}

// Type for the request body to PUT /transactions/:id (what you send to update)
export type UpdateTransactionRequest = Partial<CreateTransactionRequest>; // All fields are optional for updates

// Type for query parameters for GET /transactions (filters)
export interface ListTransactionsQuery {
  type?: TransactionType;
  fromDate?: string; // e.g., "2025-01-01"
  toDate?: string; // e.g., "2025-01-31"
  meetingId?: number;
  page?: number;
  limit?: number;
}

// Type for query parameters for GET /transactions/report
export interface ReportQueryParams {
  periodStart: string; // e.g., "2025-01-01"
  periodEnd: string;   // e.g., "2025-01-31"
}