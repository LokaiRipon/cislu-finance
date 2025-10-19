import { useState, useEffect, useRef } from 'react';
import type { ListTransactionsQuery, ListTransactionsResponse, Transaction } from '../types';
import { listTransactions } from '../services/transactionApi';

interface UseTransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: UseTransactionsState = {
  transactions: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
};

export const useTransactions = (query?: ListTransactionsQuery) => {
  const [state, setState] = useState<UseTransactionsState>(initialState);
  // Use a ref to store the query to avoid stale closure issues in refetch
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query; // Update the ref whenever query prop changes
  }, [query]);

  // Refetch function
  const refetch = () => {
    const currentQuery = queryRef.current; // Use the query stored in the ref
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response: ListTransactionsResponse = await listTransactions(currentQuery);
        setState({
          transactions: response.transactions,
          total: response.total,
          page: response.page,
          limit: response.limit,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error refetching transactions:", err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "An error occurred while fetching transactions.",
        }));
      }
    };
    fetchData(); // Call the fetch logic directly inside refetch
  };

  // Initial fetch effect - only runs on mount and when query changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response: ListTransactionsResponse = await listTransactions(query);
        setState({
          transactions: response.transactions,
          total: response.total,
          page: response.page,
          limit: response.limit,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "An error occurred while fetching transactions.",
        }));
      }
    };

    fetchData();
  }, [query]); // Only depend on query for the initial fetch

  return {
    ...state,
    refetch, // Return the new refetch function
  };
};