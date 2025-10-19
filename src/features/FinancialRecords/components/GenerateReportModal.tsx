import React, { useState } from 'react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess: (periodStart: string, periodEnd: string) => void;
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ isOpen, onClose, onGenerateSuccess }) => {
  const [dateRangeInput, setDateRangeInput] = useState({ periodStart: '', periodEnd: '' });

  const handleFetchReport = () => {
    if (!dateRangeInput.periodStart.trim() || !dateRangeInput.periodEnd.trim()) {
      alert("Please select both Start Date and End Date.");
      return;
    }

    const periodStart = new Date(dateRangeInput.periodStart);
    const periodEnd = new Date(dateRangeInput.periodEnd);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      alert("Invalid date format.");
      return;
    }

    if (periodStart > periodEnd) {
      alert("Start date must be before end date.");
      return;
    }

    onGenerateSuccess(
      periodStart.toISOString().slice(0, 10),
      periodEnd.toISOString().slice(0, 10)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.4)] w-full max-w-md text-white">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Generate Treasurer Report</h2>
            <button onClick={onClose} className="text-gray-300 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-sm font-medium mb-3">Select Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="periodStart" className="block text-sm mb-1">Start Date *</label>
                <input
                  type="date"
                  id="periodStart"
                  value={dateRangeInput.periodStart}
                  onChange={(e) => setDateRangeInput(prev => ({ ...prev, periodStart: e.target.value }))}
                  className="w-full rounded-md border border-white/30 bg-gray-800/60 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="periodEnd" className="block text-sm mb-1">End Date *</label>
                <input
                  type="date"
                  id="periodEnd"
                  value={dateRangeInput.periodEnd}
                  onChange={(e) => setDateRangeInput(prev => ({ ...prev, periodEnd: e.target.value }))}
                  className="w-full rounded-md border border-white/30 bg-gray-800/60 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleFetchReport}
                className="w-full py-2 px-4 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;
