// Contract addresses deployed on Avalanche Testnet
export const CONTRACTS = {
  ComplianceRegistry: "0x954F55f370F35ffdf976fB6D04e6982296900f5E",
  TitleNFT: "0xa5151a11bBb1F9f2272d14a78736a9e2d9eBED57",
  Fractionalizer: "0xa3874E90C79daB20e054Ed131f26Bd804a3db882",
  RentPoolMerkle: "0xeA670F4105Ce7dD1C60fd14C07b994d3Db2e4af8"
};

// Avalanche Network Configuration
export const AVALANCHE_NETWORKS = {
  testnet: {
    chainId: '0xa869', // 43113 in hex
    chainName: 'Avalanche Fuji Testnet',
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io/'],
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  },
  mainnet: {
    chainId: '0xa86a', // 43114 in hex
    chainName: 'Avalanche C-Chain',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io/'],
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  }
};

// Current network (change to mainnet for production)
export const CURRENT_NETWORK = AVALANCHE_NETWORKS.testnet;
