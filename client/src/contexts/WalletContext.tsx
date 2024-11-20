// WalletContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { connect, disconnect } from "starknetkit-latest"
import { ARGENT_WEBWALLET_URL, CHAIN_ID, provider } from '../constants';

interface WalletContextType {
  wallet: any;
  address: string;
  isConnecting: boolean;
  error: string;
  connectWallet: (useWebWallet?: boolean) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Auto-connect on startup
  // useEffect(() => {
  //   const autoConnect = async () => {
  //     try {
  //       const { wallet: connectedWallet } = await connect({
  //         provider,
  //         modalMode: "neverAsk",
  //         webWalletUrl: ARGENT_WEBWALLET_URL,
  //         argentMobileOptions: {
  //           dappName: "Chain Chat",
  //           url: window.location.hostname,
  //           chainId: CHAIN_ID,
  //           icons: [],
  //         },
  //       });
        
  //       if (connectedWallet) {
  //         setWallet(connectedWallet);
  //         setAddress(connectedWallet.account.address);
  //       }
  //     } catch (err) {
  //       console.error('Auto-connect failed:', err);
  //     }
  //   };

  //   autoConnect();
  // }, []);

  const connectWallet = useCallback(async (useWebWallet = false) => {
    setIsConnecting(true);
    setError('');


  
    
    try {
      const { wallet: connectedWallet } = await connect({
        provider,
        modalMode: "alwaysAsk",
        webWalletUrl: ARGENT_WEBWALLET_URL,
        argentMobileOptions: {
          dappName: "Your dApp Name",
          url: window.location.hostname,
          chainId: CHAIN_ID,
          icons: [],
        },
      });


      if (connectedWallet) {
        console.log(connectedWallet)
        setWallet(connectedWallet);
        setAddress(connectedWallet.account.address);
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setWallet(null);
      setAddress('');
    } catch (err) {
      setError('Failed to disconnect wallet');
      console.error(err);
    }
  }, []);

  const value = {
    wallet,
    address,
    isConnecting,
    error,
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
