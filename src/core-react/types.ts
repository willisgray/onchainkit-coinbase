import type { Address } from 'viem';
import type { ReactNode } from 'react';
import type { AppConfig } from '../core/types';
import type { Chain } from 'wagmi/chains';
import type { EASSchemaUid } from '../identity/types';

/**
 * Note: exported as public Type
 */
export type OnchainKitProviderReact = {
  address?: Address;
  apiKey?: string;
  chain: Chain;
  children: ReactNode;
  config?: AppConfig;
  rpcUrl?: string;
  schemaId?: EASSchemaUid;
  projectId?: string;
};
