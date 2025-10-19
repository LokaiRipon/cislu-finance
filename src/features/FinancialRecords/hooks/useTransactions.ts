// src/features/FinancialRecords/hooks/useTransactions.ts
import { useState, useEffect, useRef } from 'react'; // Import useRef
import type { ListTransactionsQuery, ListTransactionsResponse, Transaction } from '../types';
import { listTransactions } from '../services/transactionApi';

// Define the state structure for this hook
interface UseTransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

// Initial state when the hook first loads
const initialState: UseTransactionsState = {
  transactions: [],
  total: 0,
  page: 1,
  limit: 20, // Default limit from the backend
  loading: false,
  error: null,
};

/**
 * Custom hook to manage the list of transactions.
 * Fetches data using the mock API and provides state management.
 * @param query Optional filters for the transaction list (e.g., date range, type).
 * @returns State object containing transactions, loading status, error, and a refetch function.
 */
export const useTransactions = (query?: ListTransactionsQuery) => {
  const [state, setState] = useState<UseTransactionsState>(initialState);
  // --- NEW: Flag to track if initial fetch has been attempted ---
  const hasAttemptedInitialFetch = useRef(false);

  // Refetch function allows components to trigger a manual refresh
  const refetch = () => {
    // Reset the flag on manual refetch to allow fetching again
    hasAttemptedInitialFetch.current = false;
    setState(prev => ({ ...prev, loading: true, error: null }));
  };

  // useEffect runs when the hook mounts or when `query` changes
  useEffect(() => {
    // --- CHECK THE FLAG ---
    // If we've already tried the initial fetch and it failed, don't auto-retry
    if (hasAttemptedInitialFetch.current && state.error) {
      console.log("Skipping auto-fetch due to previous error. Use refetch() to try again.");
      return;
    }

    const fetchData = async () => {
      // --- SET THE FLAG ---
      hasAttemptedInitialFetch.current = true; // Mark that we are attempting the fetch

      try {
        // Set loading state
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Call the mock API service
        const response: ListTransactionsResponse = await listTransactions(query);

        // Update state with the fetched data
        setState({
          transactions: response.transactions,
          total: response.total,
          page: response.page,
          limit: response.limit,
          loading: false,
          error: null,
        });
      } catch (err) {
        // Handle errors (e.g., network issues, API errors)
        console.error("Error fetching transactions:", err);
        const errorMessage = (err as Error).message || "An error occurred while fetching transactions.";

        // --- UPDATE STATE WITH ERROR ---
        setState(prev => ({
          ...prev,
          loading: false,
          // --- PRESERVE PREVIOUS DATA ON ERROR ---
          // Keep existing transactions if they exist, otherwise show empty array
          // transactions: [], // Uncomment this line if you want to clear data on error
          error: errorMessage,
        }));
      }
    };

    fetchData();
  }, [query, state.error]); // Re-run when query object changes OR when error state changes (important for refetch)

  return {
    ...state, // Spread all state properties (transactions, total, page, limit, loading, error)
    refetch,   // Provide the refetch function to components
  };
};