// src/features/FinancialRecords/hooks/useTreasurerReport.ts
import { useState, useEffect } from 'react';
import type { TreasurerReport, ReportQueryParams } from '../types';
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
 * @param params Optional periodStart and periodEnd dates for the report. If null or missing required dates, no fetch occurs.
 * @returns State object containing the report, loading status, error, and a refetch function.
 */
export const useTreasurerReport = (params: ReportQueryParams | null) => {
  const [state, setState] = useState<UseTreasurerReportState>(initialState);

  // Refetch function allows components to trigger a refresh with the *current* params
  const refetch = () => {
    // Only refetch if params are valid
    if (params && params.periodStart && params.periodEnd) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      console.warn("Cannot refetch: Missing periodStart or periodEnd in params.");
      // Optionally set an error state here if refetch is called without valid params
      // setState(prev => ({ ...prev, error: "Cannot refetch: Missing required dates." }));
    }
  };

  // useEffect runs when the hook mounts or when `params` changes
  // CRITICAL: Only fetch if params is not null and contains both dates
  useEffect(() => {
    const fetchData = async () => {
      if (!params || !params.periodStart || !params.periodEnd) {
        // Do not fetch if params is null or missing required dates
        console.log("useTreasurerReport: Skipping fetch - params incomplete or null");
        return;
      }

      try {
        console.log("useTreasurerReport: Fetching report with params:", params);
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
        setState(prev => ({
          ...prev,
          loading: false,
          error: (err as Error).message || "An error occurred while fetching the report.",
        }));
      }
    };

    fetchData();
  }, [params]); // Re-run when params object changes (date range changes)

  return {
    ...state, // Spread all state properties (report, loading, error)
    refetch,   // Provide the refetch function to components
  };
};