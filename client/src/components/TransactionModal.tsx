"use client"

import React from 'react';
import { TransactionModalProps } from '../types';


const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  response,
  isProcessing 
}: TransactionModalProps) => {
  const [error, setError] = React.useState<string | null>(null);
  
  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  if (!isOpen) return null;

  const data = response.result[0].data;
  const action = response.result[0].action;

  // Format address for display
  const formatAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg 
              className="w-5 h-5 text-yellow-500" 
              fill="none" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="text-xl font-semibold">
              Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
            </h2>
          </div>
          <p className="text-gray-500 text-sm">
            {data.description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Transaction Details Card */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            {/* From */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">From</span>
              <div className="flex items-center gap-2">
                <img 
                  src={data.fromToken.logoUri} 
                  alt={data.fromToken.symbol}
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-medium">
                  {formatAddress(data.fromAddress)}
                </span>
              </div>
            </div>

            {/* To */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">To</span>
              <div className="flex items-center gap-2">
                <img 
                  src={data.toToken.logoUri} 
                  alt={data.toToken.symbol}
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-medium">
                  {formatAddress(data.toAddress)}
                </span>
              </div>
            </div>

            {/* Network */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Network</span>
              <span className="font-medium">
                {data.fromChainId.split('(')[0]}
              </span>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {(Number(data.fromAmount) / Math.pow(10, data.fromToken.decimals)).toFixed(6)}
                </span>
                <span className="text-gray-500">
                  {data.fromToken.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex gap-2">
                <svg 
                  className="w-5 h-5 text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;