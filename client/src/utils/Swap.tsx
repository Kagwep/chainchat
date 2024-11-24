import { Account, CallData, Call, uint256,cairo,BigNumberish } from 'starknet';
import { RpcProvider } from 'starknet';
import axios from 'axios';

import { toHex, parseUnits } from 'viem'
;

// Vite-specific environment variable import

const privateKey = import.meta.env.VITE_PRIVATE_KEY;
const accountAddress = import.meta.env.VITE_ACCOUNT_ADDRESS;

class StarknetSwap {
  private provider: RpcProvider;
  private account: Account;

  constructor(account) {
    this.provider = new RpcProvider({ nodeUrl: 'https://free-rpc.nethermind.io/mainnet-juno' });
    this.account = account;
  }

  public async swap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromDecimals: number,
    toDecimals: number
  ): Promise<string> {
    try {
      const quote = await this.getQuote(
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromDecimals
      );
      console.log(".........",this.account.address)
      const calldata = await this.buildSwapCalldata(
        quote.quoteId,
        0.05, // slippage
        true,  // includeApprove
        this.account.address
      );
      const calls = this.convertToCall(calldata.calls);
      return await this.executeTransactions(calls);
    } catch (e) {
      console.error("An error occurred during token swap:", e);
      throw e;
    }
  }

  private async getQuote(
    sellTokenAddress: string,
    buyTokenAddress: string,
    amount: string,
    sellTokenDecimals: number
  ): Promise<any> {
    // Convert amount to the correct decimal places
    const sellAmount = toHex(parseUnits(amount, sellTokenDecimals));

    console.log(`Converting ${amount} with ${sellTokenDecimals} decimals to: ${sellAmount}`);

    const url = `https://starknet.api.avnu.fi/swap/v2/quotes?sellTokenAddress=${sellTokenAddress}&buyTokenAddress=${buyTokenAddress}&sellAmount=${sellAmount}&size=1`;

    const response = await axios.get(url);
    return response.data[0];
  }

  private async buildSwapCalldata(
    quoteId: string,
    slippage: number,
    includeApprove: boolean,
    gasTokenAddress: string
  ): Promise<any> {
    const url = 'https://starknet.api.avnu.fi/swap/v2/build';
    const takerAddress = this.account.address
    const data = {
      quoteId,
      takerAddress,
      slippage,
      gasTokenAddress,
      includeApprove
    };

    const response = await axios.post(url, data);
    return response.data;
  }

  private async executeTransactions(calls: Call[]): Promise<string> {
    const response = await this.account.execute(calls);
    await this.provider.waitForTransaction(response.transaction_hash);
    return response.transaction_hash;
  }

  private convertToCall(data: any[]): Call[] {
    return data.map(item => ({
      contractAddress: item.contractAddress,
      entrypoint: item.entrypoint,
      calldata: CallData.compile(item.calldata)
    }));
  }

  // Helper method to format amounts for display
  public static formatTokenAmount(amount: string, decimals: number): string {
    try {
      return parseUnits(amount, decimals).toString();
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
    }
  }
}

export default StarknetSwap;

