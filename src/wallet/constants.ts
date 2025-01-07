import type { Token } from '@/token';
import { base } from 'viem/chains';

// The bytecode for the Coinbase Smart Wallet proxy contract.
export const CB_SW_PROXY_BYTECODE =
  '0x363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3';
// The address of the Coinbase Smart Wallet version 1 implementation contract.
export const CB_SW_V1_IMPLEMENTATION_ADDRESS =
  '0x000100abaad02f1cfC8Bbe32bD5a564817339E72';
// The storage slot in the proxy contract that points to the implementation address.
export const ERC_1967_PROXY_IMPLEMENTATION_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
// The Coinbase Smart Wallet factory address.
export const CB_SW_FACTORY_ADDRESS =
  '0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a';
export const WALLET_ISLAND_MAX_HEIGHT = 400;
// The default tokens that will be shown in the WalletIslandSwap sub-component.
export const WALLET_ISLAND_DEFAULT_SWAPPABLE_TOKENS: Token[] = [
    {
      name: 'ETH',
      address: '',
      symbol: 'ETH',
      decimals: 18,
      image:
        'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
      chainId: base.id,
    },
    {
      name: 'USDC',
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      symbol: 'USDC',
      decimals: 6,
      image:
        'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
      chainId: base.id,
    },
  ];
