// src/features/FinancialRecords/services/transactionApi.ts
// This file replaces the mock API implementation with real HTTP calls using fetch, including authentication.

import type {
  Transaction,
  ListTransactionsQuery,
  ListTransactionsResponse,
  CreateTransactionRequest,
  TreasurerReport,
  ReportQueryParams,
} from '../types';

// --- Environment Variable ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined in environment variables.");
}

// --- Authentication Helper ---
// Assuming the token is stored in localStorage after login
// Key used to store the JWT token in localStorage
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Retrieves the JWT token from localStorage.
 * @returns The token string or null if not found.
 */
export const getStoredAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error("Error retrieving auth token from localStorage:", e);
    return null;
  }
};

/**
 * Sets the JWT token in localStorage.
 * @param token The JWT token string.
 */
// export const setStoredAuthToken = (token: string): void => {
//   try {
//     localStorage.setItem(AUTH_TOKEN_KEY, token);
//   } catch (e) {
//     console.error("Error storing auth token in localStorage:", e);
//   }
// };

/**
 * Removes the JWT token from localStorage (e.g., on logout).
 */
// export const removeStoredAuthToken = (): void => {
//   try {
//     localStorage.removeItem(AUTH_TOKEN_KEY);
//   } catch (e) {
//     console.error("Error removing auth token from localStorage:", e);
//   }
// };

// --- Helper Function ---
const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, String(params[key]));
    }
  });
  return query.toString();
};

// --- Generic Fetch Wrapper (Handles Auth) ---
const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getStoredAuthToken();

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Merge default headers with any headers passed in options
  const mergedHeaders: HeadersInit = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };

  // console.log("Fetching:", url, fetchOptions); // Uncomment for debugging

  try {
    const response = await fetch(url, fetchOptions);
    // console.log("Response:", response); // Uncomment for debugging
    return response;
  } catch (err) {
    console.error(`API Error fetching ${url}:`, err);
    throw new Error(`Network error: ${err instanceof Error ? err.message : 'Unknown network issue'}`);
  }
};

// --- Error Handling Helper ---
const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorDetails: any = null;

    try {
      // Attempt to parse error response body
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorDetails = await response.json();
        errorMessage = errorDetails.message || errorDetails.error || errorMessage;
      } else {
        // If not JSON, get text
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (parseErr) {
      console.warn("Could not parse error response body:", parseErr);
      // Use status text or generic message if parsing fails
      errorMessage = response.statusText || errorMessage;
    }

    console.error("API request failed:", { status: response.status, statusText: response.statusText, errorDetails, errorMessage });
    throw new Error(errorMessage);
  }
  return response.json();
};

// --- API Service Functions (Real Implementation) ---

// GET /api/transactions
export const listTransactions = async (
  query: ListTransactionsQuery = {}
): Promise<ListTransactionsResponse> => {
  const queryString = buildQueryString(query);
  const url = `${API_BASE_URL}/transactions${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiFetch(url, { method: 'GET' });
    const data = await handleResponse(response);
    return data;
  } catch (err) {
    console.error("API Error in listTransactions:", err);
    throw err; // Re-throw for hook to handle
  }
};

// POST /api/transactions
export const createTransaction = async (data: CreateTransactionRequest): Promise<Transaction> => {
  const url = `${API_BASE_URL}/transactions`;

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const newTransaction = await handleResponse(response);
    return newTransaction;
  } catch (err) {
    console.error("API Error in createTransaction:", err);
    throw err; // Re-throw for form/hook to handle
  }
};

// GET /api/transactions/report
export const generateTreasurerReport = async (params: ReportQueryParams): Promise<TreasurerReport> => {
  // We Ensure periodStart and periodEnd are in the correct string format for the backend query params
  const queryString = buildQueryString({
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  });
  const url = `${API_BASE_URL}/transactions/report${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiFetch(url, { method: 'GET' });
    const report = await handleResponse(response);
    return report;
  } catch (err) {
    console.error("API Error in generateTreasurerReport:", err);
    throw err; // Re-throw for hook to handle
  }
};
