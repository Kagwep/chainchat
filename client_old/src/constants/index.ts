import ChainChaitABI from "../abi/ChainChatContract.json"
import AvnuChaitABI from "../abi/Avnu.json"

export const ChainChatContractAddress = '0x0085abb4f8c75bbfe959431628f6700b13c457d8c0caaaa0ec81d92f7810400c';
export const AvnuContractAddress = '0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f'
export const ETHTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
export const  ChainChatAbi = ChainChaitABI;
export const  AvnuChatAbi = AvnuChaitABI;


import { RpcProvider, constants } from "starknet"

export const DAITokenAddress =
  "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3"

export const ARGENT_DUMMY_CONTRACT_ADDRESS =
  "0x001c515f991f706039696a54f6f33730e9b0e8cc5d04187b13c2c714401acfd4"

export const CHAIN_ID =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA

const NODE_URL =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? "https://starknet-mainnet.public.blastapi.io"
    : "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"

export const STARKNET_CHAIN_ID =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA

export const provider = new RpcProvider({
  nodeUrl: NODE_URL,
  chainId: STARKNET_CHAIN_ID,
})

export const ARGENT_SESSION_SERVICE_BASE_URL =
  import.meta.env.VITE_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL ||
  "https://cloud.argent-api.com/v1"

export const ARGENT_WEBWALLET_URL =
  import.meta.env.VITE_PUBLIC_ARGENT_WEBWALLET_URL || "https://web.argent.xyz"
