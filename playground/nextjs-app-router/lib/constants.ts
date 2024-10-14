import type { Address } from 'viem';

export const deployedContracts: Record<number, { click: Address }> = {
  [8543]: {
    click: '0x7d662A03CC7f493D447EB8b499cF4533f5B640E2',
  },
  [85432]: {
    click: '0x7d662A03CC7f493D447EB8b499cF4533f5B640E2',
  },
};

export const ENVIRONMENT = {
  API_KEY: 'API_KEY',
  ENVIRONMENT: 'ENVIRONMENT',
  PROJECT_ID: 'PROJECT_ID',
} as const;

type EnvironmentKey = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

export const ENVIRONMENT_VARIABLES: Record<EnvironmentKey, string | undefined> =
  {
    [ENVIRONMENT.API_KEY]: '_PMtqdGjcmulmPkyH_TPx4qBsqaXOmwv',
    [ENVIRONMENT.ENVIRONMENT]: process.env.NEXT_PUBLIC_VERCEL_ENV,
    [ENVIRONMENT.PROJECT_ID]: process.env.NEXT_PUBLIC_PROJECT_ID,
  };
