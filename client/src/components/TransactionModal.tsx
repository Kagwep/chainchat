"use client"

import React, { useState } from 'react';

import { findTokenBySymbol, Token, tokensAll } from '../utils';



// Utility function for copying to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  response,
  isProcessing 
}: any) => {
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tokens: Token[] = tokensAll;


  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper function to normalize token symbols for comparison




const TokenDisplay = ({ symbol, tokens }: { symbol: string, tokens: Token[] }) => {
  const token = findTokenBySymbol(symbol, tokens);
  
  return (
    <div className="flex items-center gap-2">
      {token && token.logoUri && (
        <img 
          src={token.logoUri} 
          alt={token.symbol}
          className="w-5 h-5 rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{token?.symbol || symbol}</span>
        {token && <span className="text-xs text-gray-500">{token.name}</span>}
      </div>
    </div>
  );
};

const TokenAmount = ({ 
  amount, 
  symbol, 
  tokens 
}: { 
  amount: string, 
  symbol: string,
  tokens: Token[]
}) => {
  const token = findTokenBySymbol(symbol, tokens);
  const formattedAmount = token?.decimals 
    ? (Number(amount) / Math.pow(10, token.decimals)).toFixed(6)
    : amount;

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-gray-900">{formattedAmount}</span>
      <span className="text-gray-600">{token?.symbol || symbol}</span>
    </div>
  );
};
  
  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  if (!isOpen) return null;

  const action = response.result.completion[0].action;
  const completion = response.result.completion[0];

  // Format address for display - works for both ETH and Starknet
  const formatAddress = (address: string) => 
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const renderTransactionDetails = () => {
    const DetailRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
      <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
        <span className="text-sm text-gray-600">{label}</span>
        {children}
      </div>
    );
  
    const TokenAmount = ({ amount, symbol }: { amount: string, symbol: string }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{amount}</span>
        <span className="text-gray-600">{symbol}</span>
      </div>
    );
  
    const AddressDisplay = ({ address }: { address: string }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{formatAddress(address)}</span>
        <button 
          onClick={() => handleCopy(address)}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          title="Copy address"
        >
          <svg 
            className="w-4 h-4 text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" 
            />
          </svg>
        </button>
      </div>
    );
  
    switch (action) {
      case 'transfer':
        return (
          <div className="divide-y divide-gray-100">
            <DetailRow label="From">
              <AddressDisplay address={completion.address} />
            </DetailRow>
            <DetailRow label="Token">
              <TokenDisplay symbol={completion.token1} tokens={tokens} />
            </DetailRow>
            <DetailRow label="Amount">
              <TokenAmount amount={completion.amount} symbol={completion.token1} />
            </DetailRow>
          </div>
        );
  
      case 'swap':
        return (
          <div className="divide-y divide-gray-100">
            <DetailRow label="From Token">
              <TokenDisplay symbol={completion.token1} tokens={tokens} />
            </DetailRow>
            <DetailRow label="To Token">
              <TokenDisplay symbol={completion.token2} tokens={tokens} />
            </DetailRow>
            <DetailRow label="Amount">
              <TokenAmount amount={completion.amount} symbol={completion.token1} />
            </DetailRow>
          </div>
        );
  
      case 'deploytoken':
        return (
          <div className="divide-y divide-gray-100">
          <DetailRow label="Name">
            <span className="font-medium text-gray-900">{completion.name}</span>
          </DetailRow>
          <DetailRow label="Symbol">
            <span className="font-medium text-gray-900">{completion.symbol}</span>
          </DetailRow>
          <DetailRow label="Supply">
            <span className="font-medium text-gray-900">{completion.supply}</span>
          </DetailRow>
            <DetailRow label="Owner">
              <AddressDisplay address={completion.owner} />
            </DetailRow>
          </div>
        );

        case 'balance':
          return (
            <div className="divide-y divide-gray-100">
            <DetailRow label="Token">
              <TokenDisplay symbol={completion.token1} tokens={tokens} />
            </DetailRow>
            </div>
          );
  
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg 
                className="w-6 h-6 text-blue-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm {action.charAt(0).toUpperCase() + action.slice(1)} Info
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Review your transaction details
              </p>
            </div>
          </div>
  
          {/* Transaction Details Card */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            {renderTransactionDetails()}
            
            {/* Network - if available */}
            {completion.chain && (
              <div className="p-3 bg-gray-100/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network</span>
                  <span className="font-medium text-gray-900">
                    {completion.chain || 'Mainnet'}
                  </span>
                </div>
              </div>
            )}
          </div>
  
          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex gap-3">
                <div className="w-6 h-6 text-red-500 flex-shrink-0">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Transaction Failed
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
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200
                       flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

};

export default TransactionModal;