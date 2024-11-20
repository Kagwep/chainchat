"use client"

import { Coins, Copy, ExternalLink, Loader2, Wallet,X,Menu } from 'lucide-react';
import React, { useState } from 'react';
import { ApiResponse, Message, WalletInfo } from '../types';
import { useAccount, useConnect, useContract, useDisconnect } from '@starknet-react/core';
import { executeTransaction } from '../utils/Transaction';
import TransactionModal from './TransactionModal';
import { ETHTokenAddress, ChainChatContractAddress, ChainChatAbi, AvnuContractAddress, AvnuChatAbi } from '../constants';
import Erc20Abi from '../abi/ERC20.json'
import { Abi, Contract } from 'starknet';
import axios from "axios";
import { useWallet } from '../contexts/WalletContext';

// Utility function to format addresses in text
const formatMessageText = (text: string) => {
  // Regular expression to match both Starknet (0x followed by 64 hex characters)
  // and Ethereum-style addresses (0x followed by 40 hex characters)
  const addressRegex = /(0x[a-fA-F0-9]{64}|0x[a-fA-F0-9]{40})/g;
  
  // Split the text into parts, with addresses and regular text separated
  const parts = text.split(addressRegex);
  
  return parts.map((part, index) => {
    if (part.match(addressRegex)) {
      // Check if it's a Starknet address (64 chars after 0x) or Ethereum address (40 chars after 0x)
      const isStarknetAddress = part.length === 66; // 0x + 64 chars
      
      if (isStarknetAddress) {
        // For Starknet addresses, show first 6 and last 4 chars
        return `${part.slice(0, 6)}...${part.slice(-4)}`;
      } else {
        // For Ethereum addresses, show first 6 and last 4 chars
        return `${part.slice(0, 6)}...${part.slice(-4)}`;
      }
    }
    return part;
  }).join('');
};

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

const TokenBalance = ({ symbol, balance, value, change }) => (
  <div className="p-4 bg-gray-800 rounded-lg mb-2">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Coins size={20} className="text-gray-400" />
        <span className="font-medium text-gray-200">{symbol}</span>
      </div>
      <div className="text-right">
        <div className="text-gray-200 font-medium">{balance}</div>
        <div className="text-sm text-gray-400">${value}</div>
        <div className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Message component to handle address formatting
const ChatMessage = ({ message }: { message: Message }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          message.sender === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        } shadow-lg relative group`}
      >
        <div className="space-y-1.5">
          <p className="text-sm leading-relaxed">
            {formatMessageText(message.text)}
            {message.text.match(/(0x[a-fA-F0-9]{40})/g) && (
              <button
                onClick={() => handleCopy(message.text)}
                className="ml-2 inline-flex items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                {copied ? (
                  <span className="text-green-400 text-xs">Copied!</span>
                ) : (
                  <Copy size={12} className="text-gray-300 hover:text-white transition-colors" />
                )}
              </button>
            )}
          </p>
          <div className="flex items-center space-x-2 text-xs opacity-60">
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            {message.txHash && (
              <a 
                href="#" 
                className="flex items-center space-x-1 hover:text-blue-300 transition-colors duration-150"
              >
                <span>Tx: {message.txHash}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChainChat = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Connection established via Starknet. Start your on-chain conversation.",
      sender: 'bot',
      timestamp: new Date(),
      txHash: '0x123...456'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedWalletSWO, setSelectedWalletSWO] = useState(null);

  const {
    wallet,
    address,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  } = useWallet();
  
  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // const { contract: erc20Contract } = useContract({
  //   abi: Erc20Abi as Abi,
  //   address: ETHTokenAddress,
  // });

  const erc20Contract = new Contract(
    Erc20Abi as any,
    ETHTokenAddress,
    wallet.account as any,
  )

  const avnuContract = new Contract(
    AvnuChatAbi as any,
    AvnuContractAddress,
    wallet.account as any,
  )

  // const { contract: chainChatContract } = useContract({
  //   abi: ChainChatAbi as Abi,
  //   address: ChainChatContractAddress,
  // });

  // const { contract: avnuContract } = useContract({
  //   abi: AvnuChatAbi as Abi,
  //   address: AvnuContractAddress,
  // });

  const handleTransactionResponse = (apiResponse: ApiResponse) => {
    setResponse(apiResponse);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!response) return;
    
    setIsProcessing(true);
    try {
      await executeTransaction(
        response,
        wallet.account,
        erc20Contract,
        avnuContract,
        wallet
      );
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSend = async () => {
    if (inputText.trim() && !isTransacting) {
      setIsTransacting(true);
  
      try {
        // Prepare request data
        const requestBody = {
          prompt: inputText,
          address: address, // Replace with the actual user wallet address if applicable
        };
  
        // Call API
        const response = await axios.post(
          "https://api.brianknows.org/api/v0/agent/transaction",
          requestBody,
          {
            headers: {
              "Content-Type": "application/json",
              "x-brian-api-key": import.meta.env.VITE_BRIAN, // Replace with your actual API key
            },
          }
        );

        console.log(response.data);
  
        const result = response.data.result?.[0]; // Get the first result
        if (result) {
          const conversationHistory = result.conversationHistory || [];
  
          // Transform conversation history into messages
          const newMessages = conversationHistory.map((entry: any, index: number) => ({
            id: messages.length + index + 1,
            text: entry.content,
            sender: entry.sender,
            timestamp: new Date(),
          }));
  
          setMessages((prev) => [...prev, ...newMessages]);
          handleTransactionResponse(response.data);
         
        } else {
          console.error("No result found in the API response.");
        }
      } catch (error: any) {
        console.error("Error occurred during transaction:", error.response?.data || error.message);
      }
  
      // Reset the input and transaction state
      setInputText("");
      setIsTransacting(false);
    }
  };
  

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tokenBalances = [
    { symbol: 'ETH', balance: '1.234', value: '2,468.00', change: 2.5 },
    { symbol: 'USDC', balance: '500.00', value: '500.00', change: 0.1 },
    { symbol: 'AVNU', balance: '1000', value: '100.00', change: -1.2 },
  ];


  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
    <div className="flex h-screen bg-gray-900">
      {/* Side Panel */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
        } w-80 bg-gray-850 border-r border-gray-700 transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="p-4 bg-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">Balances</h2>
            <button 
              onClick={() => setIsSidePanelOpen(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-3">
            {tokenBalances.map((token) => (
              <TokenBalance key={token.symbol} {...token} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidePanelOpen(true)}
                className="text-gray-400 hover:text-gray-200"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                <Wallet size={16} />
                <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</span>
                <button onClick={() => handleCopy(address as string)} className="hover:text-gray-100">
                {copied ? (
                  <span className="text-green-400 text-xs">Copied!</span>
                ) : (
                  <Copy size={12} className="text-gray-300 hover:text-white transition-colors" />
                )}
                </button>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center space-x-2 disabled:bg-red-300"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                <span>Disconnect</span>
              </button>

            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
             <ChatMessage key={message.id} message={message} />
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTransacting && handleSend()}
                placeholder="Type your message..."
                disabled={isTransacting}
                className="flex-1 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={isTransacting}
                className={`px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-all duration-150 ${
                  isTransacting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isTransacting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {response && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
          response={response}
          isProcessing={isProcessing}
        />
      )}
    </div>

  </>
  );
};

export default ChainChat;