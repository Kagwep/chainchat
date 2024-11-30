'use client'

import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import ChainChat from '../components/ChainChat';
import { useAccount, useConnect } from '@starknet-react/core';
import { useWallet } from '../contexts/WalletContext';
import WalletConnect from '../components/WalletConnect';


interface WalletInfo {
  address: string;
  network: string;
}


const HomePage = () => {
    const {
      wallet,
      address,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet
    } = useWallet();
  


    
  
    if (wallet) {
      return <ChainChat />;
    }
  
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              <h1 className="text-4xl font-bold">ChainChat</h1>
            </div>
          </div>
  
          <WalletConnect />
  
          <div className="pt-4 text-sm text-gray-400">
          <p>Currently Supported:</p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Starknet</span>
            </div>
            <span className="text-orange-500">
              Using Telegram Mini? Use Web Wallet during wallet selection
            </span>
          </div>
        </div>
        </div>
      </div>
    );
  };
  

  export default HomePage;