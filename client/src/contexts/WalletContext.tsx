"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { connect, disconnect } from "starknetkit-latest"
import { ARGENT_WEBWALLET_URL, CHAIN_ID, provider } from '../constants';

// Add platform detection types
interface PlatformInfo {
  isMobile: boolean;
  isTelegramMini: boolean;
}

interface WalletContextType {
  wallet: any;
  address: string;
  isConnecting: boolean;
  error: string;
  platformInfo: PlatformInfo;
  connectWallet: (useWebWallet?: boolean) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isMobile: false,
    isTelegramMini: false
  });

  // Platform detection on mount
  useEffect(() => {
    const detectPlatform = () => {
      // Check if running in mobile browser
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Check if running in Telegram Mini App
      const isTelegramMini = Boolean(
        typeof window !== 'undefined' && 
        window.Telegram && 
        (window.Telegram as any).WebApp
      );
      
      setPlatformInfo({
        isMobile,
        isTelegramMini
      });
    };

    detectPlatform();
  }, []);

  const connectWallet = useCallback(async (useWebWallet = false) => {
    setIsConnecting(true);
    setError('');
    
    try {
      // For Telegram Mini app, force web wallet
      const shouldUseWebWallet = useWebWallet || platformInfo.isTelegramMini;
      
      const connectOptions = {
        provider,
        modalMode: shouldUseWebWallet ? "neverAsk" : "alwaysAsk",
        webWalletUrl: ARGENT_WEBWALLET_URL,
        // Only include mobile options if not using web wallet
        ...((!shouldUseWebWallet) && {
          argentMobileOptions: {
            dappName: "ChainChat",
            url: window.location.hostname,
            chainId: CHAIN_ID,
            icons: [],
          }
        })
      };

      // If using web wallet, connect directly to it
      if (shouldUseWebWallet) {
        window.open(ARGENT_WEBWALLET_URL, '_blank');
        return;
      }

      const { wallet: connectedWallet } = await connect(connectOptions as any);

      if (connectedWallet) {
        console.log('Connected wallet:', connectedWallet);
        setWallet(connectedWallet);
        setAddress(connectedWallet.account.address);
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [platformInfo]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setWallet(null);
      setAddress('');
    } catch (err) {
      setError('Failed to disconnect wallet');
      console.error('Wallet disconnect error:', err);
    }
  }, []);

  const value = {
    wallet,
    address,
    isConnecting,
    error,
    platformInfo,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};