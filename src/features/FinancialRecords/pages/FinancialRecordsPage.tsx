// src/pages/FinancialRecordsPage.tsx
import React, { useState } from 'react'; // Import useMemo
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';
import TreasurerReportCard from '../components/TreasurerReportsCard'; // Assuming this is the correct name
import GenerateReportModal from '../components/GenerateReportModal';
import type { ListTransactionsQuery } from '../types';
import { useTransactions } from '../hooks/useTransactions';

const FinancialRecordsPage: React.FC = () => {
  // State for table filters
  const [tableFilters, setTableFilters] = useState<ListTransactionsQuery>({});
  // State for modal visibility
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);
  // State for the date range for the generated treasurer report
const [reportDateRange, setReportDateRange] = useState<{ periodStart: string; periodEnd: string } | null>(null);

  // Get the refetch function from the hook if needed globally, otherwise TransactionTable handles its own data fetching
const { refetch: refetchTransactions } = useTransactions(tableFilters);

  // --- Handler for filter changes ---
  const handleTableFilterChange = (newFilters: Partial<ListTransactionsQuery>) => {
    setTableFilters(prev => ({ ...prev, ...newFilters }));
  };

  // --- Handler for successful transaction form submission ---
  const handleFormSubmitSuccess = () => {
    console.log("Transaction added successfully, triggering table refetch.");
    refetchTransactions(); // This should update the TransactionTable
    setIsAddTransactionModalOpen(false);
  };

  // --- Handler for successful report generation (from the modal) ---
  const handleGenerateReportSuccess = (periodStart: string, periodEnd: string) => {
    console.log("Report generated successfully for period:", periodStart, "to", periodEnd);
    setReportDateRange({ periodStart, periodEnd });
    setIsGenerateReportModalOpen(false); // Close the modal after successful generation
  };

  // --- Handler to clear the displayed treasurer report ---
  const handleClearReport = () => {
    setReportDateRange(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-white">
      {/* Full Width Navbar/Header */}
      <header className="w-full mb-8 p-6 bg-white shadow-md">
        <div className="max-w-7xl mx-auto"> {/* Center content within max-width */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CISLU Treasurer Dashboard</h1>
          <p className="text-gray-600">
            Manage and track all financial transactions for the Computing & Innovation Society of Laikipia University.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4"> {/* Add horizontal padding here if needed */}
        {/* Filters Section */}
        <section className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Transactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
            {/* Transaction Type */}
            <div>
              <label htmlFor="filterType" className="block font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                id="filterType"
                value={tableFilters.type || ''}
                onChange={(e) => handleTableFilterChange({ type: e.target.value as 'income' | 'expense' || undefined })}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label htmlFor="filterFromDate" className="block font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                id="filterFromDate"
                value={tableFilters.fromDate || ''}
                onChange={(e) => handleTableFilterChange({ fromDate: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-300 bg-white text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label htmlFor="filterToDate" className="block font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                id="filterToDate"
                value={tableFilters.toDate || ''}
                onChange={(e) => handleTableFilterChange({ toDate: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-300 bg-white text-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Meeting ID */}
            <div>
              <label htmlFor="filterMeetingId" className="block font-medium text-gray-700 mb-1">Meeting ID</label>
              <input
                type="number"
                id="filterMeetingId"
                value={tableFilters.meetingId || ''}
                onChange={(e) => handleTableFilterChange({ meetingId: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter a meeting"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Transaction Table */}
        <section className="mb-8">
          <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
            {/* Pass the tableFilters as the query to TransactionTable */}
            <TransactionTable query={tableFilters} />
          </div>
        </section>

        {/* Treasurer Report Card */}
        {/* Conditionally render the TreasurerReportCard only if reportDateRange is set */}
        {reportDateRange && (
          <section className="mb-8">
            <TreasurerReportCard
              reportDateRange={reportDateRange}
              onClearReport={handleClearReport} // Pass the clear handler
            />
          </section>
        )}

        {/* Descriptive Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-4">
          {/* Generate Report FAB */}
          <button
            onClick={() => setIsGenerateReportModalOpen(true)}
            className="flex items-center bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-4 py-3 rounded-full shadow-lg transform transition-transform hover:scale-105"
            title="Generate Treasurer Report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Generate Report</span> {/* Hidden on small screens */}
          </button>

          {/* Add Transaction FAB */}
          <button
            onClick={() => setIsAddTransactionModalOpen(true)}
            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-3 rounded-full shadow-lg transform transition-transform hover:scale-105"
            title="Add New Transaction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Add Transaction</span> {/* Hidden on small screens */}
          </button>
        </div>

        {/* Add Transaction Modal */}
        {isAddTransactionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl rounded-xl border border-gray-200 w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Add New Transaction</h2>
                  <button
                    onClick={() => setIsAddTransactionModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Use the TransactionForm component and pass the success handler */}
                <TransactionForm onSubmitSuccess={handleFormSubmitSuccess} />
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Modal */}
        {isGenerateReportModalOpen && (
          <GenerateReportModal
            isOpen={isGenerateReportModalOpen}
            onClose={() => setIsGenerateReportModalOpen(false)}
            onGenerateSuccess={handleGenerateReportSuccess} // Pass the success handler
          />
        )}
      </div>
    </div>
  );
};

export default FinancialRecordsPage;