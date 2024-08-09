import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChainId } from 'wagmi';
import { useShowCallsStatus } from 'wagmi/experimental';
import { useTransactionContext } from '../components/TransactionProvider';
import { useGetTransactionAction } from './useGetTransactionAction';
import { getChainExplorer } from '../../network/getChainExplorer';

vi.mock('../components/TransactionProvider', () => ({
  useTransactionContext: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useChainId: vi.fn(),
}));

vi.mock('wagmi/experimental', () => ({
  useShowCallsStatus: vi.fn(),
}));

vi.mock('../../network/getChainExplorer', () => ({
  getChainExplorer: vi.fn(),
}));

const mockGetChainExplorer = 'https://etherscan.io';

describe('useGetTransactionAction', () => {
  beforeEach(() => {
    (useChainId as vi.Mock).mockReturnValue(123);
    (useShowCallsStatus as vi.Mock).mockReturnValue({
      showCallsStatus: vi.fn(),
    });
    (getChainExplorer as vi.Mock).mockReturnValue(mockGetChainExplorer);
  });

  describe('<TransactionStatus />', () => {
    it('should return actionElement when transaction hash exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        transactionHash: '0x123',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'status' }),
      );

      expect(result.current.actionElement).toMatchInlineSnapshot(`
        <a
          href="https://etherscan.io/tx/0x123"
          rel="noreferrer"
          target="_blank"
        >
          <span
            className="font-bold font-sans text-sm leading-5 text-ock-primary"
          >
            View transaction
          </span>
        </a>
      `);
    });

    it('should return actionElement when transaction id exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        transactionId: 'ab123',
        onSubmit: vi.fn(),
      });

      const showCallsStatus = vi.fn();
      (useShowCallsStatus as vi.Mock).mockReturnValue({ showCallsStatus });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'status' }),
      );

      const button = result.current.actionElement as JSX.Element;
      expect(button.props.onClick).toBeDefined();
      expect(button).not.toBeNull();
    });

    it('should return actionElement when receipt exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        receipt: 'receipt',
        transactionHash: '123',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'status' }),
      );

      expect(result.current.actionElement).toBeNull();
    });

    it('should return actionElement when error occurs', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        errorMessage: 'error',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'status' }),
      );

      expect(result.current.actionElement).toBeNull();
    });

    it('should return actionElement when no status available', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        errorMessage: '',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'status' }),
      );

      expect(result.current.actionElement).toBeNull();
    });
  });

  describe('<TransactionToast />', () => {
    it('should return actionElement when transaction hash exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        transactionHash: '0x123',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'toast' }),
      );

      expect(result.current.actionElement).toMatchInlineSnapshot(`
        <a
          href="https://etherscan.io/tx/0x123"
          rel="noreferrer"
          target="_blank"
        >
          <span
            className="font-bold font-sans text-sm leading-5 text-ock-primary"
          >
            View transaction
          </span>
        </a>
      `);
    });

    it('should return actionElement when transaction id exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        transactionId: 'ab123',
        onSubmit: vi.fn(),
      });

      const showCallsStatus = vi.fn();
      (useShowCallsStatus as vi.Mock).mockReturnValue({ showCallsStatus });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'toast' }),
      );

      const button = result.current.actionElement as JSX.Element;
      expect(button.props.onClick).toBeDefined();
      expect(button).not.toBeNull();
    });

    it('should return actionElement when receipt exists', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        receipt: 'receipt',
        transactionHash: '0x123',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'toast' }),
      );

      expect(result.current.actionElement).toMatchInlineSnapshot(`
        <a
          href="https://etherscan.io/tx/0x123"
          rel="noreferrer"
          target="_blank"
        >
          <span
            className="font-bold font-sans text-sm leading-5 text-ock-primary"
          >
            View transaction
          </span>
        </a>
      `);
    });

    it('should return actionElement when error occurs', () => {
      const onSubmitMock = vi.fn();
      (useTransactionContext as vi.Mock).mockReturnValue({
        errorMessage: 'error',
        onSubmit: onSubmitMock,
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'toast' }),
      );

      const button = result.current.actionElement as JSX.Element;
      expect(button.props.onClick).toBe(onSubmitMock);
    });

    it('should return actionElement when no status available', () => {
      (useTransactionContext as vi.Mock).mockReturnValue({
        errorMessage: '',
      });

      const { result } = renderHook(() =>
        useGetTransactionAction({ context: 'toast' }),
      );

      expect(result.current.actionElement).toBeNull();
    });
  });
});
