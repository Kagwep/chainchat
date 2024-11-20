import { Contract } from 'starknet';
import toast from 'react-hot-toast';
import { SwapSteps, Token, TransferStep } from '../types';
import { AvnuContractAddress, ChainChatContractAddress } from '../constants';
import { number, stark, uint256,WalletAccount } from "starknet";

  

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

const handleTransaction = async (
  response: ApiResponse,
  account: any,
  erc20Contract: Contract,
  avnuContract: Contract,
  wallet: any
) => {
  if (!account || !erc20Contract || !avnuContract) {
    toast.error("Account or contracts not available", {
      duration: 4000,
    });
    console.error("Account or contracts not available");
    return;
  }




  const { action, data } = response.result[0];



  console.log(response.result[0])
  
  try {
    toast.loading("Processing transaction...", {
      id: "transaction-toast",
    });

    const { steps } = data;

    if (response.result[0].action === "transfer") {
      // Handle Transfer
      const step = steps[0];
      console.log(step)
      const amount = step.calldata[1];
      const receiverAddress = step.calldata[0];

      // const approveCall = erc20Contract.populate("approve", [
      //    ChainChatContractAddress,
      //    { low: amount, high: "0" },
      // ]);

      // console.log(approveCall)

      // const transferFromCall = chainChatContract.populate("transfer_token", [
      //   data.fromToken.address,
      //   receiverAddress,
      //   { low: amount, high: "0" },
      // ]);

      // // console.log(transferFromCall)
      // // console.log(account);

      // const multiCall = await selectedWalletSWO.account.execute([approveCall, transferFromCall]);

      // toast.success("Transfer successful!", {
      //   id: "transaction-toast",
      //   duration: 5000,
      // });

      let result = await erc20Contract.transfer(
        wallet.account.address,
        { low: amount, high: "0" },
      )

      toast.success("Transfer successful!", {
        id: "transaction-toast",
        duration: 5000,
      });

      console.log("Transfer transaction hash:", result.transaction_hash);
      return result;

    } else if (response.result[0].action === "swap") {
      // Handle Swap
      const [approveStep, swapStep] = steps;
      const step = steps[1];
      const receiverAddress = approveStep.calldata[0];

      // Prepare approve call
      const approveCall = erc20Contract.populate("approve", [
         AvnuContractAddress,
         { low: data.amountToApprove || data.fromAmount, high: "0" },
      ]);

      console.log(step);

      const transactionCalldata = step.calldata;
    
      // Create the routes array properly
      const routeStart = 12; // After the array length marker
      const route = {
          token_from: transactionCalldata[routeStart],
          token_to: transactionCalldata[routeStart + 1],
          exchange_address:transactionCalldata[routeStart + 2],
          percent: transactionCalldata[routeStart + 3],
          additional_swap_params: transactionCalldata.slice(routeStart + 5) // After its length marker
      };

      console.log(account.address,avnuContract)

      
      // Prepare swap call
      const swapCall = avnuContract.populate("multi_route_swap", [
        transactionCalldata[0],  // token_from_address
        { low: transactionCalldata[1], high: transactionCalldata[2] },  // token_from_amount
        transactionCalldata[3],  // token_to_address
        { low: transactionCalldata[4], high: transactionCalldata[5] },  // token_to_amount
        { low: transactionCalldata[6], high: transactionCalldata[7] },  // token_to_min_amount
        transactionCalldata[8],   // beneficiary
        transactionCalldata[9],  // integrator_fee_amount_bps
        transactionCalldata[10], // integrator_fee_recipient
        [route]  // Properly structured route array
    ]);

    console.log(swapCall)

     

      // Execute both calls
      const multiCall = await wallet.account.execute([approveCall, swapCall]);

      toast.success("Swap successful!", {
        id: "transaction-toast",
        duration: 5000,
      });

      console.log("Swap transaction hash:", multiCall.transaction_hash);
      return multiCall;

    } else {
      throw new Error("Unknown step type in response");
    }

  } catch (error) {
    toast.error("Transaction failed!", {
      id: "transaction-toast",
    });
    console.error("Error executing transaction:", error);
    throw error;
  }
};

const executeTransaction = async (
  apiResponse: ApiResponse,
  account: any,
  erc20Contract: Contract,
  chainChatContract: Contract,
  avnuContract: Contract,
  selectedWalletSWO: any
) => {
  try {
    const result = await handleTransaction(
      apiResponse,
      account,
      erc20Contract,
      chainChatContract,
      avnuContract,
      selectedWalletSWO
    );
    return result;
  } catch (error) {
    console.error("Failed to execute transaction:", error);
  }
};

export { handleTransaction, executeTransaction };