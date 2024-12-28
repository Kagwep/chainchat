"use client"

import React, { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, Connector } from '@starknet-react/core';
import { 
  Wallet, 
  ChevronRight, 
  X,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { shortenAddress } from '../utils';


interface ConnectWalletButtonProps {
  className?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className = '' }) => {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectingConnector, setConnectingConnector] = useState<Connector | null>(null);

  useEffect(() => {
    if (isConnected && connectingConnector) {
      setConnectingConnector(null);
      setIsModalOpen(false);
    }
  }, [isConnected, connectingConnector]);

  const handleConnect = async (connector: Connector) => {
    try {
      setIsLoading(true);
      setConnectingConnector(connector);
      await connect({ connector });
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectingConnector(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await disconnect();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center px-4 py-2 bg-sand-600 text-white rounded-lg hover:bg-sand-700 transition-colors duration-150 ${className}`}
      >
        <Wallet className="mr-2" size={20} />
        {isConnected ? shortenAddress(address) : 'Connect Wallet'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors duration-150">
                <X size={24} />
              </button>
            </div>

            {isConnected ? (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Connected Account</p>
                <p className="text-lg font-semibold text-gray-800 bg-gray-100 p-2 rounded">{shortenAddress(address)}</p>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="mt-4 w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center justify-center disabled:bg-red-300"
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => handleConnect(connector)}
                    disabled={!connector.available() || isLoading || connectingConnector !== null}
                    className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center">
                      {connector.icon && (
                        <img src={connector.icon.toString()} alt={connector.name} className="w-8 h-8 mr-3" />
                      )}
                      <span className="font-medium text-gray-800">{connector.name}</span>
                    </span>
                    {connectingConnector === connector ? (
                      <Loader2 className="animate-spin text-sand-600" size={24} />
                    ) : (
                      <ChevronRight size={24} className="text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <a
                href="https://www.starknet.io/ecosystem/wallets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sand-600 hover:text-sand-700 flex items-center justify-center transition-colors duration-150"
              >
                Learn about Starknet wallets
                <ExternalLink size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectWalletButton;