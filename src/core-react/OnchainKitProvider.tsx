'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useMemo } from 'react';

import {
  ONCHAIN_KIT_CONFIG,
  setOnchainKitConfig,
} from '@/core/OnchainKitConfig';
import { DEFAULT_PRIVACY_URL, DEFAULT_TERMS_URL } from '../core/constants';
import { createWagmiConfig } from '../core/createWagmiConfig';
import { COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID } from '../core/identity/constants';
import type { OnchainKitContextType } from '../core/types';
import { checkHashLength } from '../core/utils/checkHashLength';
import { useProviderDependencies } from './internal/hooks/useProviderDependencies';
import type { OnchainKitProviderReact } from './types';

export const OnchainKitContext =
  createContext<OnchainKitContextType>(ONCHAIN_KIT_CONFIG);

/**
 * Provides the OnchainKit React Context to the app.
 */
export function OnchainKitProvider({
  address,
  apiKey,
  chain,
  children,
  config,
  projectId,
  rpcUrl,
  schemaId,
}: OnchainKitProviderReact) {
  if (schemaId && !checkHashLength(schemaId, 64)) {
    throw Error('EAS schemaId must be 64 characters prefixed with "0x"');
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
  const value = useMemo(() => {
    const defaultPaymasterUrl = apiKey
      ? `https://api.developer.coinbase.com/rpc/v1/${chain.name
          .replace(' ', '-')
          .toLowerCase()}/${apiKey}`
      : null;
    const onchainKitConfig = {
      address: address ?? null,
      apiKey: apiKey ?? null,
      chain: chain,
      config: {
        appearance: {
          name: config?.appearance?.name ?? 'Dapp',
          logo: config?.appearance?.logo ?? '',
          mode: config?.appearance?.mode ?? 'auto',
          theme: config?.appearance?.theme ?? 'default',
        },
        paymaster: config?.paymaster || defaultPaymasterUrl,
        wallet: {
          display: config?.wallet?.display ?? 'classic',
          termsUrl: config?.wallet?.termsUrl || DEFAULT_TERMS_URL,
          privacyUrl: config?.wallet?.privacyUrl || DEFAULT_PRIVACY_URL,
        },
      },
      projectId: projectId ?? null,
      rpcUrl: rpcUrl ?? null,
      schemaId: schemaId ?? COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID,
    };
    setOnchainKitConfig(onchainKitConfig);
    return onchainKitConfig;
  }, [address, apiKey, chain, config, projectId, rpcUrl, schemaId]);

  // Check the React context for WagmiProvider and QueryClientProvider
  const { providedWagmiConfig, providedQueryClient } =
    useProviderDependencies();

  const defaultConfig = useMemo(() => {
    // IMPORTANT: Don't create a new Wagmi configuration if one already exists
    // This prevents the user-provided WagmiConfig from being overriden
    return (
      providedWagmiConfig ||
      createWagmiConfig({
        apiKey,
        appName: value.config.appearance.name,
        appLogoUrl: value.config.appearance.logo,
      })
    );
  }, [
    apiKey,
    providedWagmiConfig,
    value.config.appearance.name,
    value.config.appearance.logo,
  ]);
  const defaultQueryClient = useMemo(() => {
    // IMPORTANT: Don't create a new QueryClient if one already exists
    // This prevents the user-provided QueryClient from being overriden
    return providedQueryClient || new QueryClient();
  }, [providedQueryClient]);

  // If both dependencies are missing, return a context with default parent providers
  // If only one dependency is provided, expect the user to also provide the missing one
  if (!providedWagmiConfig && !providedQueryClient) {
    return (
      <WagmiProvider config={defaultConfig}>
        <QueryClientProvider client={defaultQueryClient}>
          <OnchainKitContext.Provider value={value}>
            {children}
          </OnchainKitContext.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <OnchainKitContext.Provider value={value}>
      {children}
    </OnchainKitContext.Provider>
  );
}
