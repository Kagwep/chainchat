import { Factory, constants as coreConstants } from 'unruggable-core'
import { getChecksumAddress } from 'starknet'
import moment from 'moment'

import { CollectEkuboFeesParameters, Config, CreateMemecoinParameters, LaunchParameters } from './types'
import { convertPercentageStringToPercent, normalizeAmountString, validateStarknetAddress } from './utils'
import { STARKNET_MAX_BLOCK_TIME } from './constants'

function getFactory(config: Config): Factory {
  return new Factory({ provider: config.starknetProvider, chainId: config.starknetChainId })
}

async function getMemecoin(factory: Factory, memecoinAddress: string) {
  if (!validateStarknetAddress(memecoinAddress)) {
    throw new Error('Invalid Starknet address')
  }
  const memecoin = await factory.getMemecoin(memecoinAddress)
  if (!memecoin) {
    throw new Error(`Memecoin with address ${memecoinAddress} not found`)
  }
  return memecoin
}

export async function createMemecoin(config: Config, parameters: CreateMemecoinParameters) {
  const factory = getFactory(config)
  try {
    const data = {
      initialSupply: parameters.initialSupply,
      name: parameters.name,
      owner: parameters.owner,
      symbol: parameters.symbol,
    }
    const { calls, tokenAddress } = factory.getDeployCalldata(data)
    
    const response = parameters.sendAsync ? 
      await parameters.sendAsync(calls) : 
      await parameters.starknetAccount.execute(calls)

    return { transactionHash: response.transaction_hash, tokenAddress }
  } catch (error) {
    console.error('Error creating meme coin:', error)
    throw new Error(`Failed to create meme coin: ${(error as any).message}`)
  }
}

export async function launchOnEkubo(config: Config, parameters: LaunchParameters) {
  const factory = getFactory(config)
  const memecoin = await getMemecoin(factory, parameters.memecoinAddress)
  const quoteToken = coreConstants.QUOTE_TOKENS[config.starknetChainId][getChecksumAddress(parameters.currencyAddress)]

  const { calls } = await factory.getEkuboLaunchCalldata(memecoin, {
    amm: coreConstants.AMM.EKUBO,
    antiBotPeriod: parameters.antiBotPeriodInSecs * 60,
    fees: convertPercentageStringToPercent(parameters.fees),
    holdLimit: convertPercentageStringToPercent(parameters.holdLimit),
    quoteToken,
    startingMarketCap: normalizeAmountString(parameters.startingMarketCap),
    teamAllocations: parameters.teamAllocations,
  })

  try {
    const response = parameters.sendAsync ? 
      await parameters.sendAsync(calls) : 
      await parameters.starknetAccount.execute(calls)

    return { transactionHash: response.transaction_hash }
  } catch (error) {
    console.error('Error launching on Ekubo:', error)
    throw new Error(`Failed to launch on Ekubo: ${(error as any).message}`)
  }
}

export async function launchOnStandardAMM(config: Config, parameters: LaunchParameters) {
  const factory = getFactory(config)
  const memecoin = await getMemecoin(factory, parameters.memecoinAddress)
  const quoteToken = coreConstants.QUOTE_TOKENS[config.starknetChainId][getChecksumAddress(parameters.currencyAddress)]

  const { calls } = await factory.getStandardAMMLaunchCalldata(memecoin, {
    amm: coreConstants.AMM.JEDISWAP,
    antiBotPeriod: parameters.antiBotPeriodInSecs * 60,
    holdLimit: convertPercentageStringToPercent(parameters.holdLimit),
    quoteToken,
    startingMarketCap: normalizeAmountString(parameters.startingMarketCap),
    teamAllocations: parameters.teamAllocations,
    liquidityLockPeriod:
      parameters.liquidityLockPeriod === coreConstants.MAX_LIQUIDITY_LOCK_PERIOD
        ? coreConstants.LIQUIDITY_LOCK_FOREVER_TIMESTAMP
        : moment().add(moment.duration(parameters.liquidityLockPeriod, 'months')).unix() + STARKNET_MAX_BLOCK_TIME,
  })

  try {
    const response = parameters.sendAsync ? 
      await parameters.sendAsync(calls) : 
      await parameters.starknetAccount.execute(calls)

    return { transactionHash: response.transaction_hash }
  } catch (error) {
    console.error('Error launching on Standard AMM:', error)
    throw new Error(`Failed to launch on Standard AMM: ${(error as any).message}`)
  }
}

export async function collectEkuboFees(config: Config, parameters: CollectEkuboFeesParameters) {
  const factory = getFactory(config)
  const memecoin = await getMemecoin(factory, parameters.memecoinAddress)

  const result = await factory.getCollectEkuboFeesCalldata(memecoin)
  if (result) {
    try {
      const response = parameters.sendAsync ? 
        await parameters.sendAsync(result.calls) : 
        await parameters.starknetAccount.execute(result.calls)

      return { transactionHash: response.transaction_hash }
    } catch (error) {
      console.error('Error collecting Ekubo fees:', error)
      throw new Error(`Failed to collect Ekubo fees: ${(error as any).message}`)
    }
  }
  return null
}