/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/FinancialRecords/components/TransactionForm.tsx
import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTransaction } from '../services/transactionApi';

// --- Zod Schema for Client-Side Validation ---
const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense']),

  sourceOrCategory: z.string()
    .min(1, { message: "Source/Category is required." })
    .max(255, { message: "Source/Category cannot exceed 255 characters." }),

  amount: z.preprocess((val) => Number(val),
    z.number().positive({ message: "Amount must be greater than 0." })
  ),

  transactionCost: z.preprocess(
  (val) => val === '' || val === null ? undefined : Number(val),
  z.number().nonnegative({ message: "Transaction cost cannot be negative." }).optional()
),


  date: z.string().optional(),

  method: z.enum(['mpesa', 'bank', 'cash', 'paypal']),

  transactionCode: z.string().optional().nullable(),
  payerOrPayee: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  meetingId: z.preprocess(
  (val) => val === '' || val === null ? undefined : Number(val),
  z.number().int().positive({ message: "Meeting ID must be a positive integer." }).optional()
),

});


// Infer the TypeScript type from the Zod schema for type safety in the form
type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onSubmitSuccess?: () => void; // Optional callback to trigger parent component actions (e.g., refetch table)
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmitSuccess }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for the submit button

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Function to set errors programmatically
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      // Set default values if needed
      type: 'income',
      method: 'mpesa',
      date: new Date().toISOString().slice(0, 16), // Default to current date/time in 'YYYY-MM-DDTHH:mm' format for datetime-local input
    },
  });

  const onSubmit: SubmitHandler<TransactionFormValues> = async (data) => {
    setSubmitError(null); // Clear any previous submit errors
    setIsSubmitting(true);

    try {
      console.log("Submitting transaction ", data);
      // Call the mock API service
      const newTransaction = await createTransaction(data);
      console.log("Transactfinpuion created successfully:", newTransaction);

      // Optionally call the parent's success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(); // This will trigger the refetch in FinancialRecordsPage
      }

      // Reset the form to clear the inputs
      reset();

      // Optionally show a success message (could be a toast notification)
      // alert('Transaction added successfully!'); // Replace with a toast notification in the future

    } catch (err) {
      console.error("Error creating transaction:", err);
      const errorMessage = (err as Error).message || "An error occurred while creating the transaction.";
      setSubmitError(errorMessage);
      // You might want to set specific field errors based on backend response here
      // setError('fieldName', { type: 'manual', message: 'Specific error message' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format error messages
  const renderError = (error: any) => {
    if (error?.message) {
      return <p className="mt-1 text-sm text-red-600">{error.message}</p>;
    }
    return null;
  };

  return (
    <>
      {submitError && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-white">
      {/* Type and Method (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">Type *</label>
          <select
            id="type"
            {...register('type')}
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.type ? 'border-red-500' : ''
            }`}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          {renderError(errors.type)}
        </div>

        {/* Method */}
        <div>
          <label htmlFor="method" className="block text-sm font-medium mb-1">Payment Method *</label>
          <select
            id="method"
            {...register('method')}
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.method ? 'border-red-500' : ''
            }`}
          >
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="paypal">PayPal</option>
          </select>
          {renderError(errors.method)}
        </div>
      </div>

      {/* Amount and Transaction Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount (KES) *</label>
          <input
            type="number"
            id="amount"
            {...register('amount', { valueAsNumber: true })}
            step="0.01"
            placeholder="0.00"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.amount ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.amount)}
        </div>

        <div>
          <label htmlFor="transactionCost" className="block text-sm font-medium mb-1">Transaction Cost (KES)</label>
          <input
            type="number"
            id="transactionCost"
            {...register('transactionCost', { valueAsNumber: true })}
            step="0.01"
            placeholder="0.00 (e.g., M-Pesa fees)"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.transactionCost ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.transactionCost)}
        </div>
      </div>

      {/* Source/Category and Payer/Payee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="sourceOrCategory" className="block text-sm font-medium mb-1">Source/Category *</label>
          <input
            type="text"
            id="sourceOrCategory"
            {...register('sourceOrCategory')}
            placeholder="Enter source or category"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.sourceOrCategory ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.sourceOrCategory)}
        </div>

        <div>
          <label htmlFor="payerOrPayee" className="block text-sm font-medium mb-1">Payer/Payee</label>
          <input
            type="text"
            id="payerOrPayee"
            {...register('payerOrPayee')}
            placeholder="Name of person or entity"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.payerOrPayee ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.payerOrPayee)}
        </div>
      </div>

      {/* Date and Transaction Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">Date & Time</label>
          <input
            type="datetime-local"
            id="date"
            {...register('date')}
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.date)}
        </div>

        <div>
          <label htmlFor="transactionCode" className="block text-sm font-medium mb-1">Transaction Code</label>
          <input
            type="text"
            id="transactionCode"
            {...register('transactionCode')}
            placeholder="Code (optional)"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.transactionCode ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.transactionCode)}
        </div>
      </div>

      {/* Meeting ID and Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="meetingId" className="block text-sm font-medium mb-1">Meeting ID</label>
          <input
            type="number"
            id="meetingId"
            {...register('meetingId', { valueAsNumber: true })}
            placeholder="Meeting ID (optional)"
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.meetingId ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.meetingId)}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Additional details (optional)"
            rows={2}
            className={`w-full rounded-md border border-white/30 bg-gray-800/60 backdrop-blur-md px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {renderError(errors.description)}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
          
              </>
            ) : (
              'Add Transaction'
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default TransactionForm;