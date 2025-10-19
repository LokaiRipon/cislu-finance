// src/features/FinancialRecords/components/TreasurerReportCard.tsx
import React, { useState, useMemo } from 'react';
import { useTreasurerReport } from '../hooks/useTreasurerReports';
import { useTransactions } from '../hooks/useTransactions';
import { format } from 'date-fns';

// --- Helper functions ---
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

const getValueColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getValueGlow = (value: number): string => {
  if (value > 0) return 'shadow-[0_0_15px_rgba(34,197,94,0.5)]';
  if (value < 0) return 'shadow-[0_0_15px_rgba(239,68,68,0.5)]';
  return 'shadow-[0_0_15px_rgba(156,163,175,0.5)]';
};

interface TreasurerReportCardProps {
  reportDateRange: { periodStart: string; periodEnd: string };
  onClearReport?: () => void;
}

const TreasurerReportCard: React.FC<TreasurerReportCardProps> = ({ reportDateRange, onClearReport }) => {
  const { report, loading, error } = useTreasurerReport(reportDateRange);

  // --- Fetch transactions for the same period for export ---
  const transactionQuery = useMemo(() => {
    if (!reportDateRange || !reportDateRange.periodStart || !reportDateRange.periodEnd) {
      return {};
    }

    return {
      fromDate: reportDateRange.periodStart,
      toDate: reportDateRange.periodEnd,
      page: 1,
      limit: 1000, // Adjust or remove limit based on expected data size
    };
  }, [reportDateRange]);

  const { transactions: periodTransactions, loading: transactionsLoading } = useTransactions(transactionQuery);

  const formatDateDisplay = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString();
  };

  // State for export dropdown
  const [showExportOptions, setShowExportOptions] = useState(false);

  // --- Enhanced Export Function (CSV) ---
  const exportToCSV = async () => {
    if (!report) return;

    let csvContent = "text/csv;charset=utf-8,";

    // 1. Metadata/Header Row
    csvContent += `Report Period:,${formatDateDisplay(reportDateRange.periodStart)},to,${formatDateDisplay(reportDateRange.periodEnd)}\n`;
    csvContent += "\n"; // Empty row for separation

    // 2. Transaction History Header
    csvContent += "Transaction History\n";
    const transactionHeaders = [
      "ID", "Date", "Type", "Category", "Payer/Payee", "Method",
      "Amount", "Balance After", "Code", "Description"
    ];
    csvContent += transactionHeaders.join(",") + "\n";

    // 3. Transaction Data Rows
    if (periodTransactions && periodTransactions.length > 0) {
      periodTransactions.forEach(t => {
        const row = [
          t.id,
          `"${format(new Date(t.date), 'dd/MM/yyyy HH:mm')}"`,
          t.type,
          `"${t.sourceOrCategory}"`,
          `"${t.payerOrPayee || 'N/A'}"`,
          t.method,
          formatCurrency(t.amount).replace(/[^\d.,-]/g, ''), // Remove currency symbol for CSV
          t.balanceAfter !== undefined ? formatCurrency(t.balanceAfter).replace(/[^\d.,-]/g, '') : 'N/A',
          `"${t.transactionCode || 'N/A'}"`,
          `"${t.description || 'N/A'}"`
        ].join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "No transactions found for the selected period.\n";
    }

    csvContent += "\n"; // Empty row for separation

    // 4. Summary Report Header
    csvContent += "Treasurer Report Summary\n";
    const summaryHeaders = ["Metric", "Value"];
    csvContent += summaryHeaders.join(",") + "\n";

    // 5. Summary Data Rows
    const summaryRows = [
      ["Total Income", formatCurrency(report.totalIncome).replace(/[^\d.,-]/g, '')],
      ["Total Expense", formatCurrency(report.totalExpense).replace(/[^\d.,-]/g, '')],
      ["Net Balance", formatCurrency(report.netBalance).replace(/[^\d.,-]/g, '')],
      ["Opening Balance", formatCurrency(report.openingBalance).replace(/[^\d.,-]/g, '')],
      ["Closing Balance", formatCurrency(report.closingBalance).replace(/[^\d.,-]/g, '')],
    ];

    summaryRows.forEach(row => {
      csvContent += `"${row[0]}",${row[1]}\n`; // Quote the label
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `treasurer_report_${reportDateRange.periodStart}_to_${reportDateRange.periodEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Export to PDF Function ---
  const exportToPDF = async () => {
    if (!report) return;

    // Dynamically import jspdf and jspdf-autotable
    const { default: jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("CISLU Treasurer Report", 14, 22);

    // Add Report Period
    doc.setFontSize(12);
    doc.text(`Period: ${formatDateDisplay(reportDateRange.periodStart)} to ${formatDateDisplay(reportDateRange.periodEnd)}`, 14, 30);

    // Add Summary Table
    doc.setFontSize(14);
    doc.text("Summary", 14, 40);
    doc.setFontSize(12);

    const summaryData = [
      ["Total Income", formatCurrency(report.totalIncome)],
      ["Total Expense", formatCurrency(report.totalExpense)],
      ["Net Balance", formatCurrency(report.netBalance)],
      ["Opening Balance", formatCurrency(report.openingBalance)],
      ["Closing Balance", formatCurrency(report.closingBalance)],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
    });

    // Add Transaction History Table
    doc.addPage(); // Create a new page for transactions
    doc.setFontSize(14);
    doc.text("Transaction History", 14, 22);
    doc.setFontSize(12);

    if (periodTransactions && periodTransactions.length > 0) {
      const transactionData = periodTransactions.map(t => [
        t.id,
        format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
        t.type,
        t.sourceOrCategory,
        t.payerOrPayee || 'N/A',
        t.method,
        formatCurrency(t.amount),
        t.balanceAfter !== undefined ? formatCurrency(t.balanceAfter) : 'N/A',
        t.transactionCode || 'N/A',
        t.description || 'N/A'
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['ID', 'Date', 'Type', 'Category', 'Payer/Payee', 'Method', 'Amount', 'Balance After', 'Code', 'Description']],
        body: transactionData,
        theme: 'grid',
        styles: { fontSize: 8 },
      });
    } else {
      doc.text("No transactions found for the selected period.", 14, 30);
    }

    // Save the PDF
    doc.save(`treasurer_report_${reportDateRange.periodStart}_to_${reportDateRange.periodEnd}.pdf`);
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">
        <div className="flex justify-center items-center p-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-b-transparent border-white rounded-full animate-spin-reverse"></div>
          </div>
          <span className="ml-4 text-gray-600">Generating report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6">
      {/* Header with Title and Actions */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Treasurer Report</h2>
        <div className="flex space-x-2">
          {onClearReport && (
            <button
              onClick={onClearReport}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100"
              title="Clear Report"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Export Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={transactionsLoading}
              className={`flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100 ${transactionsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Export as CSV or PDF"
            >
              {transactionsLoading ? (
                <svg className="animate-spin h-5 w-5 mr-1 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                </svg>
              )}
              <span>Export</span>
            </button>

            {/* Export Options Dropdown */}
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportOptions(false); // Close dropdown after click
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF();
                      setShowExportOptions(false); // Close dropdown after click
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {report && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Summary for {formatDateDisplay(reportDateRange.periodStart)} - {formatDateDisplay(reportDateRange.periodEnd)}
          </h3>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"> {/* Reduced gap */}
            {/* Total Income Card */}
            <div className="relative p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(34,197,94,0.5)] bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-500 bg-opacity-20">
                  <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <dt className="text-xs font-medium text-green-800 truncate">Total Income</dt>
                  <dd className="mt-1 text-sm font-bold text-green-600">{formatCurrency(report.totalIncome)}</dd>
                </div>
              </div>
            </div>

            {/* Total Expense Card */}
            <div className="relative p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] bg-red-50 border-red-200">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-500 bg-opacity-20">
                  <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <dt className="text-xs font-medium text-red-800 truncate">Total Expense</dt>
                  <dd className="mt-1 text-sm font-bold text-red-600">{formatCurrency(report.totalExpense)}</dd>
                </div>
              </div>
            </div>

            {/* Net Balance Card */}
            <div className={`relative p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 ${getValueGlow(report.netBalance)} ${report.netBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-opacity-20">
                  <svg className={`h-5 w-5 ${report.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <dt className="text-xs font-medium text-gray-800 truncate">Net Balance</dt>
                  <dd className={`mt-1 text-sm font-bold ${getValueColor(report.netBalance)}`}>
                    {formatCurrency(report.netBalance)}
                  </dd>
                </div>
              </div>
            </div>

            {/* Opening Balance Card */}
            <div className="relative p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(156,163,175,0.5)] bg-gray-50 border-gray-200">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-gray-500 bg-opacity-20">
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <dt className="text-xs font-medium text-gray-800 truncate">Opening Balance</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-600">{formatCurrency(report.openingBalance)}</dd>
                </div>
              </div>
            </div>

            {/* Closing Balance Card */}
            <div className="relative p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.5)] bg-purple-50 border-purple-200">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-500 bg-opacity-20">
                  <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-2">
                  <dt className="text-xs font-medium text-purple-800 truncate">Closing Balance</dt>
                  <dd className="mt-1 text-sm font-bold text-purple-600">{formatCurrency(report.closingBalance)}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasurerReportCard;