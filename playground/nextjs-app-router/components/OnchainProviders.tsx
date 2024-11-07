'use client';
import { ENVIRONMENT, ENVIRONMENT_VARIABLES } from '@/lib/constants';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { http, createConfig } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
  connectors: [
    coinbaseWallet({
      appName: 'OnchainKit',
      preference: 'smartWalletOnly',
    }),
    coinbaseWallet({
      appName: 'OnchainKit',
      preference: 'eoaOnly',
    }),
    walletConnect({
      projectId:
        ENVIRONMENT_VARIABLES[ENVIRONMENT.WALLETCONNECT_PROJECT_ID] ?? '',
      showQrModal: true,
      metadata: {
        name: 'OnchainKit',
        description: 'build onchain',
        url: 'https://onchainkit.xyz/',
        icons: [],
      },
    }),
  ],
});

const queryClient = new QueryClient();

function OnchainProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={ENVIRONMENT_VARIABLES[ENVIRONMENT.API_KEY]}
          chain={base}
          config={{
            appearance: {
              name: 'OnchainKit Playground',
              logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
              mode: 'auto',
              theme: 'default',
            },
            wallet: {
              display: 'modal',
              termsUrl: 'https://www.coinbase.com/legal/cookie', // URL to the terms of service for the wallet modal
              privacyUrl: 'https://www.coinbase.com/legal/privacy', // URL to the privacy policy for the wallet modal
            },
          }}
          projectId={ENVIRONMENT_VARIABLES[ENVIRONMENT.PROJECT_ID]}
          schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default OnchainProviders;
