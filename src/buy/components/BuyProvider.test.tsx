import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import React, { act, useCallback, useEffect } from 'react';
import type { TransactionReceipt } from 'viem';
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  http,
  WagmiProvider,
  createConfig,
  useAccount,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { base } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';
import { useSendCalls } from 'wagmi/experimental';
import { useCapabilitiesSafe } from '../../core-react/internal/hooks/useCapabilitiesSafe';
import { buildSwapTransaction } from '../../core/api/buildSwapTransaction';
import { getBuyQuote } from '../utils/getBuyQuote';
import {
  daiToken,
  degenToken,
  ethToken,
  usdcToken,
} from '../../token/constants';
import type { LifecycleStatus, SwapError, SwapUnit } from '../../swap/types';
import { getSwapErrorCode } from '../../swap/utils/getSwapErrorCode';
import { BuyProvider, useBuyContext } from './BuyProvider';
import { APIError, GetSwapQuoteResponse } from '@/core/api';
// import { isSwapError } from '../../swap/utils/isSwapError';

const mockResetFunction = vi.fn();
vi.mock('../hooks/useResetBuyInputs', () => ({
  useResetBuyInputs: () => useCallback(mockResetFunction, []),
}));

vi.mock('../utils/getBuyQuote', () => ({
  getBuyQuote: vi.fn(),
}));

vi.mock('../../core/api/buildSwapTransaction', () => ({
  buildSwapTransaction: vi
    .fn()
    .mockRejectedValue(new Error('buildSwapTransaction')),
}));

vi.mock('../../swap/utils/processSwapTransaction', () => ({
  processSwapTransaction: vi.fn(),
}));

// vi.mock('../../swap/utils/isSwapError', () => ({
//   isSwapError: vi.fn(),
// }));

const mockSwitchChain = vi.fn();
vi.mock('wagmi', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('wagmi')>()),
    useAccount: vi.fn(),
    useChainId: vi.fn(),
    useSwitchChain: vi.fn(),
  };
});

const mockAwaitCalls = vi.fn();
vi.mock('../../swap/hooks/useAwaitCalls', () => ({
  useAwaitCalls: () => useCallback(mockAwaitCalls, []),
}));

vi.mock('../../core-react/internal/hooks/useCapabilitiesSafe', () => ({
  useCapabilitiesSafe: vi.fn(),
}));

vi.mock('wagmi/actions', () => ({
  waitForTransactionReceipt: vi.fn(),
}));

vi.mock('wagmi/experimental', () => ({
  useSendCalls: vi.fn(),
}));

vi.mock('../path/to/maxSlippageModule', () => ({
  getMaxSlippage: vi.fn().mockReturnValue(10),
}));

const queryClient = new QueryClient();

const mockFromDai: SwapUnit = {
  balance: '100',
  amount: '50',
  setAmount: vi.fn(),
  setAmountUSD: vi.fn(),
  token: daiToken,
  loading: false,
  setLoading: vi.fn(),
  error: undefined,
} as unknown as SwapUnit;

const mockFromEth: SwapUnit = {
  balance: '100',
  amount: '50',
  setAmount: vi.fn(),
  setAmountUSD: vi.fn(),
  token: ethToken,
  loading: false,
  setLoading: vi.fn(),
  error: undefined,
} as unknown as SwapUnit;

const accountConfig = createConfig({
  chains: [base],
  connectors: [
    mock({
      accounts: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      ],
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={accountConfig}>
    <QueryClientProvider client={queryClient}>
      <BuyProvider
        config={{ maxSlippage: 5 }}
        experimental={{ useAggregator: true }}
        toToken={degenToken}
        fromToken={daiToken}
      >
        {children}
      </BuyProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

const renderWithProviders = ({
  Component,
  onError = vi.fn(),
  onStatus = vi.fn(),
  onSuccess = vi.fn(),
}: {
  Component: () => React.ReactNode;
  onError?: (error: SwapError) => void;
  onStatus?: (status: LifecycleStatus) => void;
  onSuccess?: (transactionReceipt?: TransactionReceipt) => void;
}) => {
  const config = { maxSlippage: 10 };
  const mockExperimental = { useAggregator: true };
  return render(
    <WagmiProvider config={accountConfig}>
      <QueryClientProvider client={queryClient}>
        <BuyProvider
          config={config}
          experimental={mockExperimental}
          onError={onError}
          onStatus={onStatus}
          onSuccess={onSuccess}
          toToken={degenToken}
          fromToken={daiToken}
        >
          <Component />
        </BuyProvider>
      </QueryClientProvider>
    </WagmiProvider>,
  );
};

const TestSwapComponent = () => {
  const context = useBuyContext();
  useEffect(() => {
    context?.from?.setToken?.(daiToken);
    context?.from?.setAmount?.('100');
    context?.to?.setToken?.(degenToken);
  }, [context]);
  const handleStatusError = async () => {
    context.updateLifecycleStatus({
      statusName: 'error',
      statusData: {
        code: 'code',
        error: 'error_long_messages',
        message: '',
      },
    });
  };
  const handleStatusAmountChange = async () => {
    context.updateLifecycleStatus({
      statusName: 'amountChange',
      statusData: {
        amountFrom: '',
        amountTo: '',
      },
    });
  };
  const handleStatusTransactionPending = async () => {
    context.updateLifecycleStatus({
      statusName: 'transactionPending',
    });
  };
  const handleStatusTransactionApproved = async () => {
    context.updateLifecycleStatus({
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: '0x123',
        transactionType: 'ERC20',
      },
    });
  };
  const handleStatusSuccess = async () => {
    context.updateLifecycleStatus({
      statusName: 'success',
      statusData: {
        transactionReceipt: { transactionHash: '0x123' },
      },
    } as unknown as LifecycleStatus);
  };
  return (
    <div data-testid="test-component">
      <span data-testid="context-value-lifecycleStatus-statusName">
        {context.lifecycleStatus.statusName}
      </span>
      {context.lifecycleStatus.statusName === 'error' && (
        <span data-testid="context-value-lifecycleStatus-statusData-code">
          {context.lifecycleStatus.statusData.code}
        </span>
      )}
      <button type="button" onClick={handleStatusError}>
        setLifecycleStatus.error
      </button>
      <button type="button" onClick={handleStatusAmountChange}>
        setLifecycleStatus.amountChange
      </button>
      <button type="button" onClick={handleStatusTransactionPending}>
        setLifecycleStatus.transactionPending
      </button>
      <button type="button" onClick={handleStatusTransactionApproved}>
        setLifecycleStatus.transactionApproved
      </button>
      <button type="button" onClick={handleStatusSuccess}>
        setLifecycleStatus.success
      </button>
      <button type="submit" onClick={() => context?.handleSubmit(mockFromEth)}>
        Swap
      </button>
    </div>
  );
};

describe('useBuyContext', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({
      address: '0x123',
    });
    (useChainId as ReturnType<typeof vi.fn>).mockReturnValue(8453);
    (useSendCalls as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      sendCallsAsync: vi.fn(),
    });
    (useSwitchChain as ReturnType<typeof vi.fn>).mockReturnValue({
      switchChainAsync: mockSwitchChain,
    });
    await act(async () => {
      renderWithProviders({ Component: () => null });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error when used outside of BuyProvider', () => {
    const TestComponent = () => {
      useBuyContext();
      return null;
    };
    // Suppress console.error for this test to avoid noisy output
    const originalError = console.error;
    console.error = vi.fn();
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBuyContext must be used within a Buy component');
    // Restore console.error
    console.error = originalError;
  });

  it('should provide context when used within BuyProvider', async () => {
    const TestComponent = () => {
      const context = useBuyContext();
      expect(context).toBeDefined();
      expect(context.from).toBeDefined();
      expect(context.to).toBeDefined();
      expect(context.handleAmountChange).toBeDefined();
      return null;
    };
    await act(async () => {
      renderWithProviders({ Component: TestComponent });
    });
  });
});

describe('BuyProvider', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    (useAccount as ReturnType<typeof vi.fn>).mockReturnValue({
      address: '0x123',
    });
    (useChainId as ReturnType<typeof vi.fn>).mockReturnValue(8453);
    (useSendCalls as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'idle',
      sendCallsAsync: vi.fn(),
    });
    (useSwitchChain as ReturnType<typeof vi.fn>).mockReturnValue({
      switchChainAsync: mockSwitchChain,
    });
    (useCapabilitiesSafe as ReturnType<typeof vi.fn>).mockReturnValue({});
  });

  it('should reset inputs when setLifecycleStatus is called with success', async () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    await act(async () => {
      result.current.updateLifecycleStatus({
        statusName: 'success',
        statusData: {
          transactionReceipt: { transactionHash: '0x123' },
        },
      } as unknown as LifecycleStatus);
    });

    await waitFor(
      () => {
        expect(mockResetFunction).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );

    expect(mockResetFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle batched transactions', async () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    (useCapabilitiesSafe as ReturnType<typeof vi.fn>).mockReturnValue({
      atomicBatch: { supported: true },
      paymasterService: { supported: true },
      auxiliaryFunds: { supported: true },
    });
    (waitForTransactionReceipt as ReturnType<typeof vi.fn>).mockResolvedValue({
      transactionHash: 'receiptHash',
    });
    await act(async () => {
      result.current.updateLifecycleStatus({
        statusName: 'transactionApproved',
        statusData: {
          transactionType: 'Batched',
        },
      });
    });
    await waitFor(() => {
      expect(mockAwaitCalls).toHaveBeenCalled();
    });
    expect(mockAwaitCalls).toHaveBeenCalledTimes(1);
  });

  it('should emit onError when setLifecycleStatus is called with error', async () => {
    const onErrorMock = vi.fn();
    renderWithProviders({ Component: TestSwapComponent, onError: onErrorMock });
    const button = screen.getByText('setLifecycleStatus.error');
    fireEvent.click(button);
    expect(onErrorMock).toHaveBeenCalled();
  });

  it('should emit onStatus when setLifecycleStatus is called with amountChange', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    const button = screen.getByText('setLifecycleStatus.amountChange');
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalled();
  });

  it('should persist statusData when upodating lifecycle status', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    fireEvent.click(screen.getByText('setLifecycleStatus.transactionPending'));
    expect(onStatusMock).toHaveBeenLastCalledWith({
      statusName: 'transactionPending',
      statusData: {
        isMissingRequiredField: true,
        maxSlippage: 10,
      },
    });
    fireEvent.click(screen.getByText('setLifecycleStatus.transactionApproved'));
    expect(onStatusMock).toHaveBeenLastCalledWith({
      statusName: 'transactionApproved',
      statusData: {
        transactionHash: '0x123',
        transactionType: 'ERC20',
        isMissingRequiredField: true,
        maxSlippage: 10,
      },
    });
  });

  it('should not persist error when updating lifecycle status', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    fireEvent.click(screen.getByText('setLifecycleStatus.error'));
    expect(onStatusMock).toHaveBeenLastCalledWith({
      statusName: 'error',
      statusData: {
        code: 'code',
        error: 'error_long_messages',
        message: '',
        isMissingRequiredField: true,
        maxSlippage: 10,
      },
    });
    fireEvent.click(screen.getByText('setLifecycleStatus.transactionPending'));
    expect(onStatusMock).toHaveBeenLastCalledWith({
      statusName: 'transactionPending',
      statusData: {
        isMissingRequiredField: true,
        maxSlippage: 10,
      },
    });
  });

  // it.only('should update lifecycle status correctly after fetching quote for to token', async () => {
  //   vi.mocked(getBuyQuote).mockResolvedValueOnce({
  //     formattedFromAmount: '1000',
  //     response: {
  //       toAmount: '1000',
  //       toAmountUSD: '$100',
  //       to: {
  //         decimals: 10,
  //       },
  //     } as unknown as GetSwapQuoteResponse,
  //   } as unknown as GetBuyQuoteResponse);

  //   (isSwapError as Mock).mockReturnValueOnce(false);

  //   const { result } = renderHook(() => useBuyContext(), { wrapper });

  //   await act(async () => {
  //     result.current.handleAmountChange('10');
  //   });
  //   expect(result.current.lifecycleStatus).toStrictEqual({
  //     statusName: 'amountChange',
  //     statusData: {
  //       amountETH: '',
  //       amountUSDC: '',
  //       amountFrom: '10',
  //       amountTo: '1e-9',
  //       isMissingRequiredField: false,
  //       maxSlippage: 5,
  //       tokenFromUSDC: usdcToken,
  //       tokenFromETH: ethToken,
  //       tokenTo: degenToken,
  //       tokenFrom: undefined
  //     },
  //   });
  // });

  // it('should update lifecycle status correctly after fetching quote for from token', async () => {
  //   vi.mocked(getBuyQuote).mockResolvedValueOnce({
  //     toAmount: '10',
  //     to: {
  //       decimals: 10,
  //     },
  //   } as unknown as GetBuyQuoteResponse);
  //   const { result } = renderHook(() => useBuyContext(), { wrapper });
  //   await act(async () => {
  //     result.current.handleAmountChange('15');
  //   });
  //   expect(result.current.lifecycleStatus).toStrictEqual({
  //     statusName: 'amountChange',
  //     statusData: {
  //       amountFrom: '1e-9',
  //       amountTo: '10',
  //       isMissingRequiredField: false,
  //       maxSlippage: 5,
  //       tokenTo: {
  //         address: '',
  //         name: 'ETH',
  //         symbol: 'ETH',
  //         chainId: 8453,
  //         decimals: 18,
  //         image:
  //           'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
  //       },
  //       tokenFrom: {
  //         address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  //         name: 'DEGEN',
  //         symbol: 'DEGEN',
  //         chainId: 8453,
  //         decimals: 18,
  //         image:
  //           'https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/3b/bf/3bbf118b5e6dc2f9e7fc607a6e7526647b4ba8f0bea87125f971446d57b296d2-MDNmNjY0MmEtNGFiZi00N2I0LWIwMTItMDUyMzg2ZDZhMWNm',
  //       },
  //     },
  //   });
  // });

  it('should emit onStatus when setLifecycleStatus is called with transactionPending', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    const button = screen.getByText('setLifecycleStatus.transactionPending');
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalled();
  });

  it('should emit onStatus when setLifecycleStatus is called with transactionApproved', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    const button = screen.getByText('setLifecycleStatus.transactionApproved');
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalled();
  });

  it('should emit onSuccess when setLifecycleStatus is called with success', async () => {
    const onSuccessMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onSuccess: onSuccessMock,
    });
    const button = screen.getByText('setLifecycleStatus.success');
    fireEvent.click(button);
    expect(onSuccessMock).toHaveBeenCalled();
  });

  it('should reset status to init when setLifecycleStatus is called with success', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    const button = screen.getByText('setLifecycleStatus.success');
    fireEvent.click(button);
    await waitFor(() => {
      expect(onStatusMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusName: 'init',
          statusData: {
            isMissingRequiredField: true,
            maxSlippage: 10,
          },
        }),
      );
    });
  });

  it('should emit onStatus when setLifecycleStatus is called with error', async () => {
    const onStatusMock = vi.fn();
    renderWithProviders({
      Component: TestSwapComponent,
      onStatus: onStatusMock,
    });
    const button = screen.getByText('setLifecycleStatus.error');
    fireEvent.click(button);
    expect(onStatusMock).toHaveBeenCalled();
  });

  it('should pass the correct slippage to getBuyQuote', async () => {
    const TestComponent = () => {
      const { handleAmountChange } = useBuyContext();
      // biome-ignore lint: hello
      React.useEffect(() => {
        const initializeSwap = () => {
          handleAmountChange('5');
        };
        initializeSwap();
      }, []);
      return null;
    };
    await act(async () => {
      renderWithProviders({ Component: TestComponent });
    });
    expect(getBuyQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSlippage: '10',
        amount: '5',
        amountReference: 'to',
        from: ethToken,
        to: degenToken,
        useAggregator: true,
      }),
    );
  });

  it('should pass the correct amountReference to get', async () => {
    const TestComponent = () => {
      const { handleAmountChange } = useBuyContext();
      // biome-ignore lint: hello
      React.useEffect(() => {
        const initializeSwap = () => {
          handleAmountChange('100');
        };
        initializeSwap();
      }, []);
      return null;
    };
    await act(async () => {
      renderWithProviders({ Component: TestComponent });
    });
    expect(getBuyQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSlippage: '10',
        amount: '100',
        amountReference: 'to',
        from: ethToken,
        to: degenToken,
        useAggregator: true,
      }),
    );
  });

  it('should handle undefined in input', async () => {
    const TestComponent = () => {
      const { handleAmountChange } = useBuyContext();
      // biome-ignore lint: hello
      React.useEffect(() => {
        const initializeSwap = () => {
          handleAmountChange('100');
        };
        initializeSwap();
      }, []);
      return null;
    };
    await act(async () => {
      renderWithProviders({ Component: TestComponent });
    });
  });

  it('should initialize with empty values', () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    expect(result.current.from?.amount).toBe('');
    expect(result.current.to?.amount).toBe('');
    expect(result.current.to?.amount).toBe('');
  });

  it('should update amount and trigger quote', async () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    await act(async () => {
      result.current.handleAmountChange('10');
    });
    expect(getBuyQuote).toHaveBeenCalled();
    expect(result.current.to?.loading).toBe(false);
  });

  it('should handle empty amount input', async () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    await act(async () => {
      await result.current.handleAmountChange('');
    });
    expect(result.current.to?.amount).toBe('');
  });

  it('should handle zero amount input', async () => {
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    await act(async () => {
      await result.current.handleAmountChange('0');
    });
    expect(result.current.to?.amount).toBe('');
  });

  it('should not setLifecycleStatus to error when getBuyQuote throws an error', async () => {
    const mockError = new Error('Test error');
    vi.mocked(getBuyQuote).mockRejectedValueOnce(mockError);
    const { result } = renderHook(() => useBuyContext(), { wrapper });
    await act(async () => {
      result.current.handleAmountChange('10');
    });
    expect(result.current.lifecycleStatus).toEqual({
      statusName: 'error',
      statusData: expect.objectContaining({
        code: 'TmSPc01',
        error: JSON.stringify(mockError),
        message: '',
      }),
    });
  });

  // it('should setLifecycleStatus to error when getBuyQuote returns an error', async () => {
  //   vi.mocked(getBuyQuote).mockResolvedValueOnce({
  //     error: 'Something went wrong' as unknown as APIError,
  //   });

  //   const { result } = renderHook(() => useBuyContext(), { wrapper });
  //   await act(async () => {
  //     result.current.handleAmountChange('10');
  //   });
  //   expect(result.current.lifecycleStatus).toEqual({
  //     statusName: 'error',
  //     statusData: expect.objectContaining({
  //       code: 'TmSPc01',
  //       error: 'Something went wrong',
  //       message: '',
  //     }),
  //   });
  // });

  it('should handle submit correctly', async () => {
    await act(async () => {
      renderWithProviders({ Component: TestSwapComponent });
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Swap'));
    });
    expect(buildSwapTransaction).toBeCalledTimes(1);
  });

  it('should not call buildSwapTransaction when missing required fields', async () => {
    const TestComponent = () => {
      const context = useBuyContext();
      return (
        <button
          type="submit"
          onClick={() => context.handleSubmit(context.from as SwapUnit)}
        >
          Swap
        </button>
      );
    };
    renderWithProviders({ Component: TestComponent });
    fireEvent.click(screen.getByText('Swap'));
    expect(buildSwapTransaction).not.toBeCalled();
  });

  it('should setLifecycleStatus to error when buildSwapTransaction throws an "User rejected the request." error', async () => {
    const mockError = {
      shortMessage: 'User rejected the request.',
    };
    vi.mocked(buildSwapTransaction).mockRejectedValueOnce(mockError);
    renderWithProviders({ Component: TestSwapComponent });
    fireEvent.click(screen.getByText('Swap'));
    await waitFor(() => {
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusName')
          .textContent,
      ).toBe('error');
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusData-code')
          .textContent,
      ).toBe('TmSPc02');
    });
  });

  it('should setLifecycleStatus to error when buildSwapTransaction throws an error', async () => {
    const mockError = new Error('Test error');
    vi.mocked(buildSwapTransaction).mockRejectedValueOnce(mockError);
    renderWithProviders({ Component: TestSwapComponent });
    fireEvent.click(screen.getByText('Swap'));
    await waitFor(() => {
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusName')
          .textContent,
      ).toBe('error');
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusData-code')
          .textContent,
      ).toBe('TmSPc02');
    });
  });

  it('should setLifecycleStatus to error when buildSwapTransaction returns an error', async () => {
    vi.mocked(buildSwapTransaction).mockResolvedValueOnce({
      code: getSwapErrorCode('uncaught-swap'),
      error: 'Something went wrong',
      message: '',
    });
    renderWithProviders({ Component: TestSwapComponent });
    fireEvent.click(screen.getByText('Swap'));
    await waitFor(() => {
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusName')
          .textContent,
      ).toBe('error');
      expect(
        screen.getByTestId('context-value-lifecycleStatus-statusData-code')
          .textContent,
      ).toBe('UNCAUGHT_SWAP_ERROR');
    });
  });

  it('should use default maxSlippage when not provided in experimental', () => {
    const useTestHook = () => {
      const { lifecycleStatus } = useBuyContext();
      return lifecycleStatus;
    };
    const config = { maxSlippage: 3 };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WagmiProvider config={accountConfig}>
        <QueryClientProvider client={queryClient}>
          <BuyProvider
            config={config}
            experimental={{ useAggregator: true }}
            toToken={usdcToken}
          >
            {children}
          </BuyProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
    const { result } = renderHook(() => useTestHook(), { wrapper });
    expect(result.current.statusName).toBe('init');
    if (result.current.statusName === 'init') {
      expect(result.current.statusData.maxSlippage).toBe(3);
    }
  });
});
