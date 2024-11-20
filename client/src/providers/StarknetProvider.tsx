"use client";

import React, { useCallback } from "react";
 
import { ArgentMobileConnector } from "starknetkit/argentMobile" 
import { WebWalletConnector } from "starknetkit/webwallet"
import { mainnet, sepolia } from "@starknet-react/chains" 
import { Connector, InjectedConnector, StarknetConfig, publicProvider } from "@starknet-react/core"; 
import ControllerConnector from "@cartridge/connector";



export function StarknetProvider({ children }: { children: React.ReactNode }) {

  const rpc = useCallback(() => {
    return { nodeUrl: 'https://api.cartridge.gg/x/starknet/mainnet' };
  }, []);
   
  
  const chains = [mainnet, sepolia]
  const connectors = [
 
    new WebWalletConnector(),
    new InjectedConnector({ options: { id: "argentX" } }),
    new InjectedConnector({ options: { id: "braavos" } }),
    new ControllerConnector({
      rpc: rpc().nodeUrl,
    }) as never as Connector,
  ]
 
  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  )
}