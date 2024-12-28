"use client"

import { Wallet } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";

// Example usage component
const WalletConnect = () => {
    const {
      wallet,
      address,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet
    } = useWallet();
  
    return (
      <div className="flex flex-col items-center space-y-4">
        {!wallet && (
          <div className="flex gap-4">
            <button 
              onClick={() => connectWallet(false)}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}
  
        {wallet && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-gray-700">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
  
        {error && (
          <div className="w-full max-w-md p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>
    );
  };
  
  export default WalletConnect;