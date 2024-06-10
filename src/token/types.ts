// 🌲☀️🌲
import { ReactElement } from 'react';
import { Address } from 'viem';

/**
 * Note: exported as public Type
 */
export type FormatAmountOptions = {
  locale?: string; // User locale (default: browser locale)
  minimumFractionDigits?: number; // Minimum fraction digits for number decimals
  maximumFractionDigits?: number; // Maximum fraction digits for number decimals
};

/**
 * Note: exported as public Type
 */
export type FormatAmountResponse = string; // See Number.prototype.toLocaleString for more info

/**
 * Note: exported as public Type
 */
export type GetTokensError = {
  code: number; // The Error code
  error: string; // The Error message
};

/**
 * Note: exported as public Type
 */
export type GetTokensResponse = Token[] | GetTokensError;

/**
 * Note: exported as public Type
 */
export type GetTokensOptions = {
  limit?: string; // The maximum number of tokens to return (default: 50)
  search?: string; // A string to search for in the token name, symbol or address
  page?: string; // The page number to return (default: 1)
};

/**
 * Note: exported as public Type
 */
export type Token = {
  address: Address | ''; // The address of the token contract, this value will be empty for native ETH
  chainId: number; // The chain id of the token contract
  decimals: number; // The number of token decimals
  image: string | null; // A string url of the token logo
  name: string;
  symbol: string; // A ticker symbol or shorthand, up to 11 characters
};

/**
 * Note: exported as public Type
 */
export type TokenChipReact = {
  token: Token;
  onClick?: (token: Token) => void;
};

/**
 * Note: exported as public Type
 */
export type TokenImageReact = {
  className?: string; // Optional additional CSS class to apply to the component
  size?: number;
  token: Token;
};

/**
 * Note: exported as public Type
 */
export type TokenRowReact = {
  token: Token;
  amount?: string;
  onClick?: (token: Token) => void;
  hideSymbol?: boolean;
  hideImage?: boolean;
};

/**
 * Note: exported as public Type
 */
export type TokenSearchReact = {
  onChange: (value: string) => void;
  delayMs?: number;
};

/**
 * Note: exported as public Type
 */
export type TokenSelectorReact = {
  children: ReactElement<{ onToggle: () => void }>;
  setToken: (token: Token) => void;
  token?: Token;
};

/**
 * Note: exported as public Type
 */
export type TokenSelectorDropdownReact = {
  onToggle?: () => void; // Injected by TokenSelector
  options: Token[]; // List of tokens
  setToken: (token: Token) => void; // Token setter
};

export type TokenAmountInputReact = {
  label: string;
  amount?: string;
  token?: Token;
  swappableTokens: Token[];
  tokenBalance?: string;
  onMaxButtonClick?: () => void;
  onAmountChange: (amount: string) => void;
  onTokenSelectorClick: () => void;
  onSelectTokenToggle: () => void;
  disabled?: boolean;
};
