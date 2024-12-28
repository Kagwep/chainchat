// GlobalContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AccountInterface } from 'starknet';

interface GlobalContextType {
  account: AccountInterface | undefined;
  address: string | null;
  setAccount: (account: AccountInterface | undefined) => void;
  setAddress: (address: string | null) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<AccountInterface | undefined>();
  const [address, setAddress] = useState<string | null>(null);

  return (
    <GlobalContext.Provider value={{ account, address, setAccount, setAddress }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};