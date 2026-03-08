import { createConfig, http, createStorage } from 'wagmi'
import { mainnet, bsc, bscTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = {
  chainId: 97,
  rpcUrl: 'https://bsc-testnet.publicnode.com',
  minFeed: 1,
  maxFeed: 100,
  dailyLimit: 10,
  expPerToken: 10,
  topN: 5,
  dividendPercent: 10,
  apiBase: 'http://localhost:3001'
}

export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, bscTestnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  storage: createStorage({ storage: window?.localStorage }),
})

export { mainnet, bsc, bscTestnet } from 'wagmi/chains'
