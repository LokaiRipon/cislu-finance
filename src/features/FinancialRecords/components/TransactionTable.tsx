// src/features/FinancialRecords/components/TransactionTable.tsx
import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import type { ListTransactionsQuery } from '../types';
import { format } from 'date-fns';

// Define props for the component
interface TransactionTableProps {
  query?: ListTransactionsQuery; // Optional filters to pass to the hook
}

const TransactionTable: React.FC<TransactionTableProps> = ({ query }) => {
  // State for current page
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Define items per page

  // Create a new query object that includes the page and limit
  const paginatedQuery = {
    ...query,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  };

  // Use the custom hook to get transaction data and state with the paginated query
  const { transactions, loading, error, total } = useTransactions(paginatedQuery);

  // Helper function to format currency (assuming KES based on Mpesa)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES', // Adjust if different currency is needed
    }).format(amount);
  };

  // Helper function to format date nicely
  const formatDate = (isoString: string): string => {
    return format(new Date(isoString), 'dd/MM/yyyy HH:mm'); // e.g., "15/01/2025 10:00"
  };

  // Helper function to get a color class based on transaction type
  const getTypeColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  // Helper function to get a background color class for the type badge
  const getTypeBadgeColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Helper function to get a background color class for the method badge
  const getMethodBadgeColor = (method: string): string => {
    const colors: Record<string, string> = {
      mpesa: 'bg-blue-100 text-blue-800',
      bank: 'bg-indigo-100 text-indigo-800',
      cash: 'bg-yellow-100 text-yellow-800',
      paypal: 'bg-gray-100 text-gray-800',
    };
    return colors[method.toLowerCase()] || 'bg-gray-100 text-gray-800'; // Default fallback
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        {/* Futuristic loading spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-b-transparent border-white rounded-full animate-spin-reverse"></div>
        </div>
        <span className="ml-4 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error!</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no transactions found after filtering/loading
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new transaction.
        </p>
      </div>
    );
  }

  // --- Pagination Logic ---
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Financial Transactions</h2>
        <p className="text-sm text-blue-100 mt-1">
          Showing {transactions.length} of {total} transactions
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payer/Payee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance After
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.sourceOrCategory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.payerOrPayee || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodBadgeColor(transaction.method)}`}>
                    {transaction.method}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getTypeColor(transaction.type)}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.balanceAfter !== undefined ? formatCurrency(transaction.balanceAfter) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.transactionCode || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {transaction.description || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer (Pagination) */}
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage <= 1
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage >= totalPages
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;