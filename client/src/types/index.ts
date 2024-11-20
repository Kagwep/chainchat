export interface ThemeContextInterface {
    darkTheme: boolean;
    toggleTheme(): void;
}


export interface Token {
    address: string;   // Token contract address (as a string)
    name: string;      // Name of the token (e.g., Ether)
    symbol: string;    // Token symbol (e.g., ETH)
    decimals: number;  // Decimals (e.g., 18 for Ether)
    logoUri: string;   // URL to the token's logo
  }
  

  export interface WalletInfo {
    address: string;
    network: string;
  }
  
  export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    txHash?: string;
  }
  

  

export interface TransferStep {
  transfer: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
}

export interface SwapSteps {
  approve: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  transactionData: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
}

export interface ApiResponse {
  result: [{
    solver: string;
    action: string;
    type: string;
    data: {
      description: string;
      steps: TransferStep[];
      fromToken: Token;
      toToken: Token;
      fromAmount: string;
      fromAddress: string;
      toAddress: string;
      fromChainId: string;
      toChainId: string;
    };
  }];
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  response: ApiResponse;
  isProcessing: boolean;
}


export interface TransferStep {
  transfer: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
}

