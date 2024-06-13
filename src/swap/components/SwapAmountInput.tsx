import { useCallback, useContext, useEffect, useMemo } from 'react';

import { isValidAmount } from '../utils';
import { TokenChip } from '../../token';
import { cn } from '../../utils/cn';
import { SwapContext } from '../context';
import type { SwapAmountInputReact } from '../types';
import { useBalance, type UseBalanceReturnType } from 'wagmi';

export function SwapAmountInput({ label, token, type }: SwapAmountInputReact) {
  const {
    address,
    fromAmount,
    setFromAmount,
    setFromToken,
    setToAmount,
    setToToken,
    toAmount,
  } = useContext(SwapContext);

  const amount = useMemo(() => {
    if (type === 'to') {
      return toAmount;
    }
    return fromAmount;
  }, [type, toAmount, fromAmount]);

  const setAmount = useMemo(() => {
    if (type === 'to') {
      return setToAmount;
    }
    return setFromAmount;
  }, [type, setToAmount, setFromAmount]);

  const setToken = useMemo(() => {
    if (type === 'to') {
      return setToToken;
    }
    return setFromToken;
  }, [type, setFromToken, setToToken]);

  const balanceResponse: UseBalanceReturnType = useBalance({
    address,
    ...(token?.address && { token: token.address }),
  });

  const roundedBalance = useMemo(() => {
    if (balanceResponse?.data?.formatted && token?.address) {
      return Number(balanceResponse?.data?.formatted)
        ?.toPrecision(5)
        .toString();
    }
  }, [balanceResponse?.data]);

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isValidAmount(event.target.value)) {
        setAmount?.(event.target.value);
      }
    },
    [setAmount],
  );

  const handleMaxButtonClick = useCallback(() => {
    if (balanceResponse?.data?.formatted) {
      setAmount?.(balanceResponse?.data?.formatted);
    }
  }, [balanceResponse?.data, setAmount]);

  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token, setToken]);

  return (
    <div
      className={cn(
        'box-border flex w-full flex-col items-start',
        'gap-[11px] border-b border-solid bg-[#FFF] p-4',
      )}
      data-testid="ockSwapAmountInput_Container"
    >
      <div className="flex w-full items-center justify-between">
        <label className="text-sm font-semibold text-[#030712]">{label}</label>
        {roundedBalance && (
          <label className="text-sm font-normal text-gray-400">{`Balance: ${roundedBalance}`}</label>
        )}
      </div>
      <div className="flex w-full items-center justify-between">
        <TokenChip token={token} />
        {type === 'from' && (
          <button
            className="flex h-8 w-[58px] max-w-[200px] items-center rounded-[40px] bg-gray-100 px-3 py-2 text-base font-medium not-italic leading-6 text-gray-500"
            data-testid="ockSwapAmountInput_MaxButton"
            disabled={roundedBalance === undefined}
            onClick={handleMaxButtonClick}
          >
            Max
          </button>
        )}
      </div>
      <input
        className="w-full border-[none] bg-transparent text-5xl text-[black]"
        data-testid="ockSwapAmountInput_Input"
        onChange={handleAmountChange}
        placeholder="0"
        value={amount}
      />
    </div>
  );
}
