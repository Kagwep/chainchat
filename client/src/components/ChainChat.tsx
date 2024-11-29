"use client"

import { Send, Bot, User, DollarSign, Menu, X, Wallet, Copy, Loader2, ExternalLink, Coins, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { ApiResponse,  WalletInfo } from '../types';
import { useAccount, useConnect, useContract, useDisconnect } from '@starknet-react/core';
import { executeTransaction } from '../utils/Transaction';
import TransactionModal from './TransactionModal';
import { ETHTokenAddress, ChainChatContractAddress, ChainChatAbi, AvnuContractAddress, AvnuChatAbi } from '../constants';
import Erc20Abi from '../abi/ERC20.json'
import { Abi, Contract } from 'starknet';
import axios from "axios";
import { useWallet } from '../contexts/WalletContext';
import { brian } from '../utils/Generate';
import { AskRequestBody, ChatRequestBody, ExtractParametersRequestBody,GenerateCodeRequestBody } from '@brian-ai/sdk';
import { createMemecoin, launchOnEkubo } from 'unruggable-sdk';
import { constants } from "starknet";
import TokenCategoryDisplay from './TokenCategoryDisplay';
import StarknetSwap from '../utils/Swap';
import ResponsiveSidePanel from './ResponsiveSidePanel';
import CommandGuide from './CommandGuide';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  txHash?: string;
  tokenAddress?: string;
  mode: 'chat' | 'transaction';
  error?: string;

}

interface TokenBalance {
  symbol: string;
  balance: string;
  value: string;
  change: number;
}

// Utility function to format addresses in text
const formatMessageText = (text: string) => {
  // Regular expression for both Starknet and Ethereum addresses
  const addressRegex = /(0x[a-fA-F0-9]{64}|0x[a-fA-F0-9]{40})/g;
  
  // Split the text into parts, with addresses and regular text separated
  const parts = text.split(addressRegex);
  
  return parts.map((part, index) => {
    if (part.match(addressRegex)) {
      const isStarknetAddress = part.length === 66; // 0x + 64 chars
      const truncated = `${part.slice(0, 6)}...${part.slice(-4)}`;
      
      return (
        <span key={index} className="font-mono bg-gray-700/50 px-1 rounded">
          {truncated}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
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

const TokenBalance = ({ symbol, balance, value, change }: TokenBalance) => (
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
);;

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

  const handleCopyMessage = async (message: Message) => {
    // Construct text with message and time, plus transaction details if available
    const copyText = [
      message.text,
      `Time: ${message.timestamp.toLocaleTimeString()}`,
      message.txHash && `Transaction: ${message.txHash}`,
      message.txHash && `Explorer: https://starkscan.co/tx/${message.txHash}`
    ].filter(Boolean).join('\n');

    const success = await copyToClipboard( copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${
      message.id === '1' ? 'mt-4' : ''
    }`}>
      {message.sender === 'agent' && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
          message.mode === 'transaction' ? 'bg-purple-900' : 'bg-gray-700'
        }`}>
          <Bot size={20} className="text-blue-400" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-4 ${
          message.sender === 'user'
            ? 'bg-blue-600 text-white'
            : message.id === '1'
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white'
            : 'bg-gray-800 text-gray-100'
        } shadow-lg relative group`}
      >
        <div className="space-y-1.5">
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {formatMessageText(message.text)}
            {message.text && (
                <div className="group">
                 
                <button
                  onClick={() => handleCopyMessage(message)} 
                  className="ml-2 inline-flex items-center text-xs opacity-100 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {copied ? (
                    <span className="text-green-400 text-xs">Copied!</span>
                  ) : (
                    <Copy size={12} className="text-gray-300 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            )}
          </p>
          <div className="flex items-center space-x-2 text-xs opacity-60">
              <span>{message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
              {message.txHash && (
              <a 
              href={`https://starkscan.co/tx/${message.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-blue-300 transition-colors duration-150"
            >
              <span>Tx: {message.txHash.slice(0, 6)}...{message.txHash.slice(-4)}</span>
              <ExternalLink size={12} />
            </a>
            )}
          </div>
        </div>
      </div>

      {message.sender === 'user' && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 ${
          message.mode === 'transaction' ? 'bg-purple-600' : 'bg-blue-600'
        }`}>
          <User size={20} className="text-white" />
        </div>
      )}
    </div>
  );
};

const ChainChat = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: "👋 Welcome! I'm your your assistant. I can help you with:",
      timestamp: new Date(),
      mode: 'chat'
    },
    {
      id: '2',
      sender: 'agent',
      text: "💰 Transaction Mode:\n• Send tokens\n• Swap tokens\n• Approve contracts\n• Deploy unruggable meme coins",
      timestamp: new Date(),
      mode: 'chat'
    },
    {
      id: '3',
      sender: 'agent',
      text: "💬 Chat Mode:\n• Get blockchain information\n• Check token prices\n• Learn about DeFi protocols",
      timestamp: new Date(),
      mode: 'chat'
    },
    {
      id: '4',
      sender: 'agent',
      text: "Switch modes using the toggle above. Your wallet balances are available in the side panel. How can I assist you today?",
      timestamp: new Date(),
      mode: 'chat'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedWalletSWO, setSelectedWalletSWO] = useState(null);
  const [mode, setMode] = useState<'chat' | 'transaction'>('transaction');

  const {
    wallet,
    address,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  } = useWallet();

  const starknetSwap = new StarknetSwap(wallet.account);
  
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

  const handleTransactionResponse = (apiResponse: any) => {
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

  const handleConfirmPromptInput = async () => {
    if (!response) return;
    
    setIsProcessing(true);
    try {
      const result: any  = await executeTransaction(
        response,
        wallet.account,
        erc20Contract,
        avnuContract,
        wallet
      );

      const newMessage: Message = {
        id: (messages.length + 3).toString(),
        text: result.success ? 'success' : 'error',
        sender: 'agent',
        timestamp: new Date(),
        txHash: result,
        mode: 'transaction'
      };

      if (result.success) {
        newMessage.text = 'Transaction submitted successfully';
        newMessage.txHash = result.transactionHash;
        
        if (result.tokenAddress) {
          newMessage.tokenAddress = result.tokenAddress;
          newMessage.text += `. Token deployed at ${result.tokenAddress}`;
        }

        if (result.balance){
          newMessage.text = `Your balance is ${result.balance}`;
        }
      } else {
        newMessage.text = result.error || 'Transaction failed. Please try again.';
        newMessage.error = result.error;
      }
    
      setMessages(prevMessages => [...prevMessages, newMessage as any]);

      setIsModalOpen(false);
    }catch (error) {
      const errorMessage: Message = {
        id: (messages.length + 3).toString(),
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
        sender: 'agent',
        timestamp: new Date(),
        mode: 'transaction',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }  finally {
      setIsProcessing(false);
    }
  };

  const handPromptInput = async () => {

    if (inputText.trim() && !isTransacting) {
      setIsTransacting(true);

     

      if(mode === 'chat'){
        try {
          console.log('User input:', inputText);
        
          // Create new message object
          const newMessage = {
            id: (messages.length + 1).toString(),
            text: inputText,
            sender: 'user' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
        
          // First update to show user message immediately
          setMessages(prevMessages => [...prevMessages, newMessage]);
        
          // Make API request
          const response = await brian.ask({
            prompt: inputText,
            kb: 'starknet_kb'
          });
        
          // Create response message
          const agentResponse = {
            id: (messages.length + 2).toString(), // +2 because we already added user message
            text: response.answer,
            sender: 'agent' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
        
          // Update with both messages
          setMessages(prevMessages => [...prevMessages, agentResponse]);
        
          console.log('API response:', response);
        
        } catch (error) {
          console.error('Error processing message:', error);
          
          // Optional: Add error message to chat
          const errorMessage = {
            id: (messages.length + 2).toString(),
            text: 'Sorry, there was an error processing your message. Please try again.',
            sender: 'agent' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
          
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }

      }else {
        try {
          // Prepare request data
          const requestBody = {
            prompt: inputText,
            address: address, // Replace with the actual user wallet address if applicable
          };

          const newMessage = {
            id: (messages.length + 1).toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
            mode: 'transaction'
          };
        
          setMessages(prevMessages => [...prevMessages, newMessage as any]);
    
          // Call API
          const response = await axios.post(
            "https://api.brianknows.org/api/v0/agent/parameters-extraction",
            requestBody,
            {
              headers: {
                "Content-Type": "application/json",
                "x-brian-api-key": import.meta.env.VITE_BRIAN, // Replace with your actual API key
              },
            }
          );
  
          console.log(response.data);

          const newMessage1 = {
            id: (messages.length + 2).toString(),
            text: "Processing instructions...",
            sender: 'agent',
            timestamp: new Date(),
            mode: 'transaction'
          };
        
          setMessages(prevMessages => [...prevMessages, newMessage1 as any]);

          handleTransactionResponse(response.data)


        } catch (error: any) {
          console.error("Error occurred during transaction:", error.response?.data || error.message);

        // Optional: Add error message to chat
        const errorMessage = {
          id: (messages.length + 2).toString(),
          text: 'Sorry, there was an error processing your message. Please try again.',
          sender: 'agent' as const,
          timestamp: new Date(),
          mode: 'chat' as const
        };
        
        setMessages(prevMessages => [...prevMessages, errorMessage]);

        }
      }
  

  
      // Reset the input and transaction state
      setInputText("");
      setIsTransacting(false);
    }
  }


  const handleSend = async () => {
    
    if (inputText.trim() && !isTransacting) {
      setIsTransacting(true);

     

      if(mode === 'chat'){
        try {
          console.log('User input:', inputText);
        
          // Create new message object
          const newMessage = {
            id: (messages.length + 1).toString(),
            text: inputText,
            sender: 'user' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
        
          // First update to show user message immediately
          setMessages(prevMessages => [...prevMessages, newMessage]);
        
          // Make API request
          const response = await brian.ask({
            prompt: inputText,
            kb: 'starknet_kb'
          });
        
          // Create response message
          const agentResponse = {
            id: (messages.length + 2).toString(), // +2 because we already added user message
            text: response.answer,
            sender: 'agent' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
        
          // Update with both messages
          setMessages(prevMessages => [...prevMessages, agentResponse]);

          
        
          console.log('API response:', response);
        
        } catch (error) {
          console.error('Error processing message:', error);
          
          // Optional: Add error message to chat
          const errorMessage = {
            id: (messages.length + 2).toString(),
            text: 'Sorry, there was an error processing your message. Please try again.',
            sender: 'agent' as const,
            timestamp: new Date(),
            mode: 'chat' as const
          };
          
          setMessages(prevMessages => [...prevMessages, errorMessage]);
        }

      }else {
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


          if(response.data.result[0]?.action === "balance"){

            const result = response.data.result?.[0];

            if(result){
              const conversationHistory = result.conversationHistory || [];
    
              // Transform conversation history into messages
              const newMessages = conversationHistory.map((entry: any, index: number) => ({
                id: messages.length + index + 1,
                text: entry.content,
                sender: entry.sender === 'user' ? entry.sender : 'agent',
                timestamp: new Date(),
                mode: 'transaction'
              }));
      
              setMessages((prev) => [...prev, ...newMessages]);
              setIsProcessing(false);
              return
            }

          }


    
          const result = response.data.result?.[0]; // Get the first result
          if (result) {
            const conversationHistory = result.conversationHistory || [];
    
            // Transform conversation history into messages
            const newMessages = conversationHistory.map((entry: any, index: number) => ({
              id: messages.length + index + 1,
              text: entry.content,
              sender: entry.sender === 'user' ? entry.sender : 'agent',
              timestamp: new Date(),
              mode: 'transaction'
            }));
    
            setMessages((prev) => [...prev, ...newMessages]);
            handleTransactionResponse(response.data);
           
          } else {
            console.error("No result found in the API response.");
          }
        } catch (error: any) {
          console.error("Error occurred during transaction:", error.response?.data || error.message);
        }
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
      <div className="relative">
        <ResponsiveSidePanel 
          isSidePanelOpen={isSidePanelOpen} 
          setIsSidePanelOpen={setIsSidePanelOpen}
        >
          <TokenCategoryDisplay />
        </ResponsiveSidePanel>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Restructured for mobile */}
        <div className="bg-gray-800 border-b border-gray-700 p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto w-full gap-2 sm:gap-4">
            {/* Top row on mobile - Menu and Wallet */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsSidePanelOpen(true)}
                className="text-gray-400 hover:text-gray-200 p-2"
              >
                <Menu size={24} />
              </button>
              
              <div className="flex items-center gap-2">
                {/* Wallet Address */}
                <div className="flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-gray-700 rounded-full text-xs sm:text-sm text-gray-300">
                  <Wallet size={16} className="mr-2" />
                  <span className="hidden xs:inline">{formatAddress(address)}</span>
                  <span className="xs:hidden">{formatAddress(address).slice(0, 8)}...</span>
                  <button
                    onClick={() => handleCopy(wallet.account.address)} 
                    className="ml-2 p-1"
                  >
                    {copied ? (
                      <span className="text-green-400 text-xs">✓</span>
                    ) : (
                      <Copy size={12} className="text-gray-300 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:ml-2 sm:inline text-xs sm:text-sm">Disconnect</span>
                </button>
              </div>
            </div>

            {/* Mode Switch - Full width on mobile */}
            <div className="flex rounded-lg overflow-hidden border border-gray-700 w-full sm:w-auto">
              <button
                onClick={() => setMode('chat')}
                className={`flex-1 sm:flex-none px-4 py-2 flex items-center justify-center gap-2 text-sm ${
                  mode === 'chat' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <User size={16} />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setMode('transaction')}
                className={`flex-1 sm:flex-none px-4 py-2 flex items-center justify-center gap-2 text-sm ${
                  mode === 'transaction' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <DollarSign size={16} />
                <span>Transaction</span>
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
        <CommandGuide />

        {/* Input Section - Restructured for mobile */}
        <div className="border-t border-gray-700 p-2 sm:p-4 bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-2 sm:gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTransacting && handPromptInput()}
                placeholder="Type your message..."
                disabled={isTransacting}
                className="flex-1 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder-gray-500 text-sm sm:text-base"
              />
              <button
                onClick={handPromptInput}
                disabled={isTransacting}
                className={`px-3 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-150 ${
                  isTransacting
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isTransacting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {response && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmPromptInput}
          response={response}
          isProcessing={isProcessing}
        />
      )}
  </>
  );
};

export default ChainChat;