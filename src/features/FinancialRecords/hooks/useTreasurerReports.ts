// src/features/FinancialRecords/hooks/useTreasurerReport.ts
import { useState, useEffect, useRef } from 'react'; // Import useRef
import type { ReportQueryParams, TreasurerReport } from '../types';
import { generateTreasurerReport } from '../services/transactionApi';

// Define the state structure for this hook
interface UseTreasurerReportState {
  report: TreasurerReport | null;
  loading: boolean;
  error: string | null;
}

// Initial state when the hook first loads
const initialState: UseTreasurerReportState = {
  report: null,
  loading: false,
  error: null,
};

/**
 * Custom hook to manage the treasurer report data.
 * Fetches data using the mock API and provides state management.
 * @param params Optional periodStart and periodEnd dates for the report.
 * @returns State object containing the report, loading status, error, and a refetch function.
 */
export const useTreasurerReport = (params: ReportQueryParams | null) => {
  const [state, setState] = useState<UseTreasurerReportState>(initialState);
  // --- NEW: Flag to track if initial fetch has been attempted ---
  const hasAttemptedInitialFetch = useRef(false);

  // Refetch function allows components to trigger a manual refresh
  const refetch = () => {
    // Reset the flag on manual refetch to allow fetching again
    hasAttemptedInitialFetch.current = false;
    setState(prev => ({ ...prev, loading: true, error: null }));
  };

  // useEffect runs when the hook mounts or when `params` changes
  useEffect(() => {
    // --- CHECK THE FLAG ---
    // If we've already tried the initial fetch and it failed, don't auto-retry
    if (hasAttemptedInitialFetch.current && state.error) {
      console.log("Skipping auto-fetch for treasurer report due to previous error. Use refetch() to try again.");
      return;
    }

    const fetchData = async () => {
      if (!params || !params.periodStart || !params.periodEnd) {
        // Don't fetch if params are not provided (e.g., on initial load)
        return;
      }

      // --- SET THE FLAG ---
      hasAttemptedInitialFetch.current = true; // Mark that we are attempting the fetch

      try {
        // Set loading state
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Call the mock API service
        const response: TreasurerReport = await generateTreasurerReport(params);

        // Update state with the fetched data
        setState({
          report: response,
          loading: false,
          error: null,
        });
      } catch (err) {
        // Handle errors (e.g., network issues, API errors)
        console.error("Error fetching treasurer report:", err);
        const errorMessage = (err as Error).message || "An error occurred while fetching the report.";

        // --- UPDATE STATE WITH ERROR ---
        setState(prev => ({
          ...prev,
          loading: false,
          // --- PRESERVE PREVIOUS REPORT ON ERROR ---
          // Keep existing report if it exists, otherwise show null
          // report: null, // Uncomment this line if you want to clear data on error
          error: errorMessage,
        }));
      }
    };

    fetchData();
  }, [params, state.error]); // Re-run when params object changes OR when error state changes (important for refetch)

  return {
    ...state, // Spread all state properties (report, loading, error)
    refetch,   // Provide the refetch function to components
  };
};