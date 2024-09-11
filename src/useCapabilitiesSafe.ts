import type { WalletCapabilities } from 'viem';
import { useAccount } from 'wagmi';
import { useCapabilities } from 'wagmi/experimental';
import type { UseCapabilitiesSafeParams } from './types';

export function useCapabilitiesSafe({
  chainId,
}: UseCapabilitiesSafeParams): WalletCapabilities {
  const { isConnected } = useAccount();

  const { data: capabilities, error } = useCapabilities({
    query: { enabled: isConnected },
  });

  if (error || !capabilities || !capabilities[chainId]) {
    return {};
  }

  return capabilities[chainId];
}
