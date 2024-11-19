// AppContext.js
import { ENVIRONMENT, ENVIRONMENT_VARIABLES } from '@/lib/constants';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import type React from 'react';
import { createContext, useEffect, useState } from 'react';
import { useConnect, useConnectors } from 'wagmi';
import { base } from 'wagmi/chains';
import { WalletPreference } from './form/wallet-type';
import {
  type CheckoutOptions,
  CheckoutTypes,
  type ComponentMode,
  type ComponentTheme,
  OnchainKitComponent,
  type Paymaster,
  TransactionTypes,
} from '@/types/onchainkit';
import { initializeStateFromUrl } from '@/lib/url-params';
import { useStateWithStorage } from '@/lib/hooks';

type State = {
  activeComponent?: OnchainKitComponent;
  setActiveComponent?: (component: OnchainKitComponent) => void;
  walletType?: WalletPreference;
  setWalletType?: (walletType: WalletPreference) => void;
  clearWalletType?: () => void;
  chainId?: number;
  defaultMaxSlippage?: number;
  setDefaultMaxSlippage?: (defaultMaxSlippage: number) => void;
  setChainId?: (chainId: number) => void;
  transactionType?: TransactionTypes;
  setTransactionType?: (transactionType: TransactionTypes) => void;
  paymasters?: Record<number, Paymaster>; // paymasters is per network
  setPaymaster?: (chainId: number, url: string, enabled: boolean) => void;
  checkoutOptions?: CheckoutOptions;
  setCheckoutOptions?: (checkoutOptions: CheckoutOptions) => void;
  checkoutTypes?: CheckoutTypes;
  setCheckoutTypes?: (checkoutTypes: CheckoutTypes) => void;
  componentTheme?: ComponentTheme;
  setComponentTheme: (theme: ComponentTheme) => void;
  componentMode: ComponentMode;
  setComponentMode: (mode: ComponentMode) => void;
  nftToken?: string;
  setNFTToken: (nftToken: string) => void;
  setIsSponsored: (isSponsored: boolean) => void;
  isSponsored?: boolean;
};

const defaultState: State = {
  activeComponent: OnchainKitComponent.Transaction,
  chainId: base.id,
  componentTheme: 'default',
  setComponentTheme: () => {},
  componentMode: 'auto',
  setComponentMode: () => {},
  setNFTToken: () => {},
  setIsSponsored: () => {},
};

export const AppContext = createContext(defaultState);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { connect } = useConnect();
  const connectors = useConnectors();

  const [activeComponent, setActiveComponent] =
    useStateWithStorage<OnchainKitComponent>({
      key: 'activeComponent',
      defaultValue: defaultState.activeComponent,
    });

  const [componentTheme, setComponentTheme] =
    useStateWithStorage<ComponentTheme>({
      key: 'componentTheme',
      defaultValue: 'none',
    });

  const [componentMode, setComponentMode] = useStateWithStorage<ComponentMode>({
    key: 'componentMode',
    defaultValue: defaultState.componentMode,
  });

  const [walletType, setWalletType] = useStateWithStorage<
    WalletPreference | undefined
  >({
    key: 'walletType',
    defaultValue: WalletPreference.SMART_WALLET,
  });

  const [chainId, setChainId] = useStateWithStorage<number>({
    key: 'chainId',
    parser: (v) => Number.parseInt(v),
    defaultValue: defaultState.chainId,
  });

  const [transactionType, setTransactionType] =
    useStateWithStorage<TransactionTypes>({
      key: 'transactionType',
      defaultValue: TransactionTypes.Contracts,
    });

  const [checkoutOptions, setCheckoutOptionsState] =
    useState<CheckoutOptions>();

  const [checkoutTypes, setCheckoutTypes] = useStateWithStorage<CheckoutTypes>({
    key: 'checkoutTypes',
    defaultValue: CheckoutTypes.ProductID,
  });

  const [paymasters, setPaymastersState] =
    useState<Record<number, Paymaster>>();

  const [defaultMaxSlippage, setDefaultMaxSlippage] =
    useStateWithStorage<number>({
      key: 'defaultMaxSlippage',
      parser: (v) => Number.parseInt(v),
      defaultValue: 3,
    });

  const [nftToken, setNFTToken] = useStateWithStorage<string>({
    key: 'nftToken',
    defaultValue: '0x1D6b183bD47F914F9f1d3208EDCF8BefD7F84E63:1',
  });

  const [isSponsored, setIsSponsoredState] = useState<boolean>(false);

  // Load initial values from localStorage
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this component
  useEffect(() => {
    const urlState = initializeStateFromUrl();

    // Component-specific options
    const storedPaymasters =
      urlState.paymasterurl || localStorage.getItem('paymasters');
    const storedIsSponsored =
      urlState.issponsored || localStorage.getItem('isSponsored');

    if (storedPaymasters) {
      setPaymastersState(JSON.parse(storedPaymasters));
    }
    if (storedIsSponsored) {
      setIsSponsoredState(JSON.parse(storedIsSponsored));
    }
  }, []);

  // Connect to wallet if walletType changes
  useEffect(() => {
    if (walletType === WalletPreference.SMART_WALLET) {
      connect({ connector: connectors[0] });
    } else if (walletType === WalletPreference.EOA) {
      connect({ connector: connectors[1] });
    }
  }, [connect, connectors, walletType]);

  function clearWalletType() {
    localStorage.setItem('walletType', '');
    setWalletType(undefined);
  }

  const setCheckoutOptions = (checkoutOptions: CheckoutOptions) => {
    localStorage.setItem('productId', checkoutOptions.productId || '');
    setCheckoutOptionsState(checkoutOptions);
  };

  const setPaymaster = (chainId: number, url: string, enabled: boolean) => {
    const newObj = {
      ...paymasters,
      [chainId]: { url, enabled },
    };
    localStorage.setItem('paymasters', JSON.stringify(newObj));
    setPaymastersState(newObj);
  };

  const setIsSponsored = (isSponsored: boolean) => {
    console.log('Component isSponsored changed: ', isSponsored);
    localStorage.setItem('isSponsored', JSON.stringify(isSponsored));
    setIsSponsoredState(isSponsored);
  };

  return (
    <AppContext.Provider
      value={{
        activeComponent,
        setActiveComponent,
        walletType,
        setWalletType,
        clearWalletType,
        chainId,
        setChainId,
        componentTheme,
        setComponentTheme,
        componentMode,
        setComponentMode,
        checkoutOptions,
        setCheckoutOptions,
        checkoutTypes,
        setCheckoutTypes,
        paymasters,
        setPaymaster,
        transactionType,
        setTransactionType,
        defaultMaxSlippage,
        setDefaultMaxSlippage,
        nftToken,
        setNFTToken,
        setIsSponsored,
        isSponsored,
      }}
    >
      <OnchainKitProvider
        apiKey={ENVIRONMENT_VARIABLES[ENVIRONMENT.API_KEY]}
        chain={base}
        config={{
          appearance: {
            name: 'OnchainKit Playground',
            logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
            mode: componentMode,
            theme: componentTheme === 'none' ? undefined : componentTheme,
          },
          paymaster: paymasters?.[chainId || 8453]?.url,
        }}
        projectId={ENVIRONMENT_VARIABLES[ENVIRONMENT.PROJECT_ID]}
        schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
      >
        {children}
      </OnchainKitProvider>
    </AppContext.Provider>
  );
};
