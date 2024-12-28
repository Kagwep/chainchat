import { RequestResult } from '@starknet-react/core';
import { AccountInterface, ProviderInterface, constants, Call } from 'starknet'



export type SendAsyncFunction = (args?: Call[]) => Promise<RequestResult<"wallet_addInvokeTransaction">>;

export interface Config {
  starknetChainId: constants.StarknetChainId
  starknetProvider: ProviderInterface
}

export interface CreateMemecoinParameters {
  starknetAccount: AccountInterface
  sendAsync?: SendAsyncFunction
  name: string
  symbol: string
  owner: string
  initialSupply: string
}

export interface LaunchParameters {
  starknetAccount: AccountInterface
  sendAsync?: SendAsyncFunction
  memecoinAddress: string
  startingMarketCap: string
  holdLimit: string
  fees: string
  antiBotPeriodInSecs: number
  liquidityLockPeriod?: number
  currencyAddress: string
  teamAllocations: {
    address: string
    amount: number | string
  }[]
}

export interface CollectEkuboFeesParameters {
  starknetAccount: AccountInterface
  sendAsync?: SendAsyncFunction
  memecoinAddress: string
}