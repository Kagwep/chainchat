import { Contract} from 'starknet';
import toast from 'react-hot-toast';
import { SwapSteps, Token, TransferStep } from '../types';
import { AvnuContractAddress, ChainChatContractAddress, provider, STARKNET_CHAIN_ID } from '../constants';
import { number, stark, uint256,WalletAccount } from "starknet";
import { findTokenBySymbol, parseInputAmountToUint256, tokensAll } from '.';
import StarknetSwap from './Swap';
import Erc20Abi from '../abi/ERC20.json'
import { createMemecoin } from 'unruggable-sdk';
import { StarknetIdNavigator } from "starknetid.js";
import { Provider, constants } from "starknet";

export interface ResponseData {
  result: {
    prompt: string;
    completion?: any[];
  };
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  tokenAddress?: string;
  error?: string;
}

const providerId = new Provider();
const starknetIdNavigator = new StarknetIdNavigator(
  provider,
  constants.StarknetChainId.SN_MAIN
);

type Steps = TransferStep[] | [SwapSteps['approve'], SwapSteps['transactionData']];

interface ApiResponse {
  result: [{
    solver: string;
    action: string;
    type: string;
    data: {
      steps: Steps;
      fromToken: Token;
      toToken: Token;
      fromAmount: string;
      toAmount: string;
      amountToApprove?: string;
      description: string;
      receiver: string;
    };
  }];
}




// Type guard to check if steps are for a transfer
const isTransferSteps = (steps: Steps): steps is TransferStep[] => {
    return 'transfer' in (steps[0] || {});
  };
  
  // Type guard to check if steps are for a swap
  const isSwapSteps = (steps: Steps): steps is [SwapSteps['approve'], SwapSteps['transactionData']] => {
    return 'approve' in (steps[0] || {}) && 'transactionData' in (steps[1] || {});
  };

  function handleApiResponse(response: ResponseData) {
    if (response.result.completion && response.result.completion.length > 0) {
      const action = response.result.completion[0].action;
  
      // Check for the action and handle different cases using a switch statement
      switch (action) {
        case 'transfer':

          // You can add more logic to handle transfer-specific operations
          break;
  
        case 'swap':

          // Add your logic for handling swaps
          break;
  
        default:
          console.log("Unknown action");
          break;
      }
    } else {
      console.log("No completion data found in response.");
    }
  }

  const handleTransaction = async (
    response: any,
    account: any,
    erc20Contract: Contract,
    avnuContract: Contract,
    wallet: any
  ) => {

    const starknetSwap = new StarknetSwap(wallet.account);

    if (response.result.completion && response.result.completion.length > 0) {
      const action = response.result.completion[0].action;
      const completion = response.result.completion[0];
  
      // Check for the action and handle different cases using a switch statement
      switch (action) {
        case 'transfer':


          const { token1: token, address, amount: token_amount, chain: use_chain } = completion;
          
          const transferParams = {
            tokenSymbol: token,
            toAddress: address,
            token_amount,
            fromAddress: wallet.account.address,
            chainId: use_chain || 'SN_MAIN', // Default to mainnet if not specified
          };

          if (!transferParams.toAddress) {
            toast.error("Please provide recipient");
            return false;
          }



          if (!transferParams.fromAddress) {
            toast.error("Please connect your wallet");
            return false;
          }

                    // Check if address is a Starknet ID
          if (transferParams.toAddress.endsWith('.stark')) {
            try {
              const resolvedAddress = await starknetIdNavigator.getAddressFromStarkName(transferParams.toAddress);
              if (!resolvedAddress) {
                toast.error("Could not resolve Starknet ID");
                return false;
              }
              transferParams.toAddress = resolvedAddress;
            } catch (error) {
              toast.error("Error resolving Starknet ID");
              return false;
            }
          }

          const toTransfer = findTokenBySymbol(transferParams.tokenSymbol,tokensAll);

          if (!toTransfer) {
            toast.error("Invalid token");
            return false;
          }

          // Handle decimal amount
          const tamount = parseFloat(transferParams.token_amount);
          if (isNaN(tamount) || tamount <= 0) {
            toast.error("Please enter a valid amount");
            return false;
          }

          const toastIdp = toast.loading("Transaction pending...");

          try {

            const erc20Contract = new Contract(
              Erc20Abi as any,
              toTransfer.address,
              wallet.account as any,
            )

            // You'll need to modify your StarknetSwap class to handle dynamic token pairs
            const transactionHash = await erc20Contract.transfer(
              transferParams.toAddress,
              parseInputAmountToUint256(transferParams.token_amount),
            );

            console.log(transactionHash)

                        // Dismiss the loading toast
            toast.dismiss(toastIdp);
            
            // Show success toast
            toast.success(`Transaction submitted!`, {
              duration: 5000,
              position: "top-right",
            });

            return {
              success: true,
              transactionHash: transactionHash.transaction_hash
            };
            
          } catch (error) {
                          // Dismiss the loading toast
              toast.dismiss(toastIdp);
              const errorMessage = error instanceof Error ? error.message : "Transaction failed";
              // Show error toast
              toast.error(error instanceof Error ? error.message : "Transaction failed", {
                duration: 5000,
                position: "top-right",
              });
  
              return {
                success: false,
                error: errorMessage
              };
          } 
        
          
          console.log('Executing transfer with params:', transferParams);

          // You can add more logic to handle transfer-specific operations
          break;
  
        case 'swap':
          const { token1, token2, amount, chain } = completion;
      
          const swapParams = {
            fromToken: token1,
            toToken: token2,
            amount,
            userAddress: wallet.account.address,
            chainId: chain || 'SN_MAIN',
          };

          if (!swapParams.userAddress) {
            toast.error("Please connect your wallet");
            return false;
          }

          const fromToken = findTokenBySymbol(swapParams.fromToken,tokensAll);
          const toToken =  findTokenBySymbol(swapParams.toToken,tokensAll);
          
          if (!fromToken || !toToken) {
            toast.error("One or both tokens not found");
            return false;
          }
        
          // Handle decimal amount
          const samount = parseFloat(swapParams.amount);
          if (isNaN(samount) || samount <= 0) {
            toast.error("Please enter a valid amount");
            return false;
          }

          const toastId = toast.loading("Transaction pending...");

          try {
            // You'll need to modify your StarknetSwap class to handle dynamic token pairs
            const transactionHash = await starknetSwap.swap(
              fromToken.address,
              toToken.address,
              swapParams.amount,
              fromToken.decimals,
              toToken.decimals
            );
            console.log(transactionHash)

                        // Dismiss the loading toast
            toast.dismiss(toastId);
            
            // Show success toast
            toast.success(`Transaction submitted!`, {
              duration: 5000,
              position: "top-right",
            });

            return {
              success: true,
              transactionHash: transactionHash
            };
            
          } catch (error) {
                          // Dismiss the loading toast
              toast.dismiss(toastId);
              const errorMessage = error instanceof Error ? error.message : "Transaction failed";
              // Show error toast
              toast.error(error instanceof Error ? error.message : "Transaction failed", {
                duration: 5000,
                position: "top-right",
              });
  
              return {
                success: false,
                error: errorMessage
              };
          } 
        
          console.log('Executing swap with params:', swapParams);
          // Add your logic for handling swaps
          break;

        case 'deploytoken':

        const { name, symbol, supply, uri } = completion;
        const owner = wallet.account.address; // Set owner as wallet address

        const config = {
          starknetProvider: provider,
          starknetChainId: STARKNET_CHAIN_ID,
        };
        


        // Now you have all the token deployment parameters
        const deployParams = {
            name,
            symbol,
            initialSupply: supply,
            owner,
            uri: uri || '', // Use empty string if uri is not provided
        };

        if (!deployParams.owner) {
          toast.error("Please connect your wallet");
          return false;
        }

        if (!deployParams.name || deployParams.name === '') {
          toast.error("the name is missing");
          return false;
        }

        if (!deployParams.symbol || deployParams.symbol === '') {
          toast.error("the symbol is missing");
          return false;
        }

        // Handle decimal amount
        const damount = parseFloat(deployParams.initialSupply);
        if (isNaN(damount) || damount <= 0) {
          toast.error("Please enter a valid amount");
          return false;
        }
        
        console.log('Deploying token with params:', deployParams);

        const toastId2 = toast.loading("Transaction pending...");

        try {
          // You'll need to modify your StarknetSwap class to handle dynamic token pairs
          const createResult = await createMemecoin(config as any, {
            name: deployParams.name,
            symbol: deployParams.symbol,
            initialSupply: deployParams.initialSupply,
            owner: wallet.account.address,
            starknetAccount: wallet.account,
          });

          console.log(createResult)

                      // Dismiss the loading toast
          toast.dismiss(toastId2);
          
          // Show success toast
          toast.success(`Transaction submitted!`, {
            duration: 5000,
            position: "top-right",
          });

          return {
            success: true,
            transactionHash: createResult.transactionHash,
            tokenAddress: createResult.tokenAddress // Include token address if available
          };
          
        } catch (error) {
                        // Dismiss the loading toast
            toast.dismiss(toastId2);
            const errorMessage = error instanceof Error ? error.message : "Transaction failed";
            // Show error toast
            toast.error(error instanceof Error ? error.message : "Transaction failed", {
              duration: 5000,
              position: "top-right",
            });

            return {
              success: false,
              error: errorMessage
            };
        } 
      

        
          break;
  
        default:
          console.log("Unknown action");
          break;
      }
    } else {
      console.log("No completion data found in response.");
    }

  }

// const handleTransaction = async (
//   response: ApiResponse,
//   account: any,
//   erc20Contract: Contract,
//   avnuContract: Contract,
//   wallet: any
// ) => {
//   if (!account || !erc20Contract || !avnuContract) {
//     toast.error("Account or contracts not available", {
//       duration: 4000,
//     });
//     console.error("Account or contracts not available");
//     return;
//   }




//   const { action, data } = response.result[0];



//   console.log(response.result[0])
  
//   try {
//     toast.loading("Processing transaction...", {
//       id: "transaction-toast",
//     });

//     const { steps } = data;

//     if (response.result[0].action === "transfer") {
//       // Handle Transfer
//       const step = steps[0];
//       console.log(step)
//       const amount = step.calldata[1];
//       const receiverAddress = step.calldata[0];

//       // const approveCall = erc20Contract.populate("approve", [
//       //    ChainChatContractAddress,
//       //    { low: amount, high: "0" },
//       // ]);

//       // console.log(approveCall)

//       // const transferFromCall = chainChatContract.populate("transfer_token", [
//       //   data.fromToken.address,
//       //   receiverAddress,
//       //   { low: amount, high: "0" },
//       // ]);

//       // // console.log(transferFromCall)
//       // // console.log(account);

//       // const multiCall = await selectedWalletSWO.account.execute([approveCall, transferFromCall]);

//       // toast.success("Transfer successful!", {
//       //   id: "transaction-toast",
//       //   duration: 5000,
//       // });

//       let result = await erc20Contract.transfer(
//         wallet.account.address,
//         { low: amount, high: "0" },
//       )

//       toast.success("Transfer successful!", {
//         id: "transaction-toast",
//         duration: 5000,
//       });

//       console.log("Transfer transaction hash:", result.transaction_hash);
//       return result;

//     } else if (response.result[0].action === "swap") {
//       // Handle Swap
//       const [approveStep, swapStep] = steps;
//       const step = steps[1];
//       const receiverAddress = approveStep.calldata[0];

//       // Prepare approve call
//       const approveCall = erc20Contract.populate("approve", [
//          AvnuContractAddress,
//          { low: data.amountToApprove || data.fromAmount, high: "0" },
//       ]);

//       console.log(step);

//       const transactionCalldata = step.calldata;
    
//       // Create the routes array properly
//       const routeStart = 12; // After the array length marker
//       const route = {
//           token_from: transactionCalldata[routeStart],
//           token_to: transactionCalldata[routeStart + 1],
//           exchange_address:transactionCalldata[routeStart + 2],
//           percent: transactionCalldata[routeStart + 3],
//           additional_swap_params: transactionCalldata.slice(routeStart + 5) // After its length marker
//       };

//       console.log(account.address,avnuContract)

      
//       // Prepare swap call
//       const swapCall = avnuContract.populate("multi_route_swap", [
//         transactionCalldata[0],  // token_from_address
//         { low: transactionCalldata[1], high: transactionCalldata[2] },  // token_from_amount
//         transactionCalldata[3],  // token_to_address
//         { low: transactionCalldata[4], high: transactionCalldata[5] },  // token_to_amount
//         { low: transactionCalldata[6], high: transactionCalldata[7] },  // token_to_min_amount
//         transactionCalldata[8],   // beneficiary
//         transactionCalldata[9],  // integrator_fee_amount_bps
//         transactionCalldata[10], // integrator_fee_recipient
//         [route]  // Properly structured route array
//     ]);

//     console.log(swapCall)

     

//       // Execute both calls
//       const multiCall = await wallet.account.execute([approveCall, swapCall]);

//       toast.success("Swap successful!", {
//         id: "transaction-toast",
//         duration: 5000,
//       });

//       console.log("Swap transaction hash:", multiCall.transaction_hash);
//       return multiCall;

//     } else if (response.result[0].action === "balance") {



      

//     }
//      else {
//       throw new Error("Unknown step type in response");
//     }

//   } catch (error) {
//     toast.error("Transaction failed!", {
//       id: "transaction-toast",
//     });
//     console.error("Error executing transaction:", error);
//     throw error;
//   }
// };

const executeTransaction = async (
  apiResponse: ApiResponse,
  account: any,
  erc20Contract: Contract,
  avnuContract: Contract,
  selectedWalletSWO: any
) => {
  try {
    const result = await handleTransaction(
      apiResponse,
      account,
      erc20Contract,
      avnuContract,
      selectedWalletSWO
    );
    return result;
  } catch (error) {
    console.error("Failed to execute transaction:", error);
  }
};

export { handleTransaction, executeTransaction };