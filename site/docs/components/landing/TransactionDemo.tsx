import {
    Transaction,
    TransactionButton,
    TransactionSponsor,
    TransactionStatus,
    TransactionStatusAction,
    TransactionStatusLabel,
  } from '@coinbase/onchainkit/transaction';
import TransactionWrapper from '../TransactionWrapper.tsx';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Avatar, Name } from '@coinbase/onchainkit/identity';
import App from '../App.tsx';

export const transactionDemoCode = `
  import { 
    Transaction, 
    TransactionButton,
    TransactionSponsor,
    TransactionStatus,
    TransactionStatusAction,
    TransactionStatusLabel,
  } from '@coinbase/onchainkit/transaction'; 
  import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
  import { 
    Wallet, 
    ConnectWallet,
  } from '@coinbase/onchainkit/wallet';
  import { 
    Avatar, 
    Name, 
  } from '@coinbase/onchainkit/identity';
  import { useAccount } from 'wagmi';
  import { contracts } from './contracts'; 

  export default function TransactionComponent() {
    const { address } = useAccount();
    const handleOnStatus = useCallback((status: LifecycleStatus) => {
      console.log('LifecycleStatus', status);
    }, []);
    
    return (
      <TransactionDefault
        contracts={contracts}
      />
    )
  }
  `

function TransactionDemo() {
    return (
        <App>
        <TransactionWrapper>
          {({ address, contracts, onError, onSuccess }) => {
            const capabilities = {
              paymasterService: {
                url: import.meta.env.VITE_CDP_PAYMASTER_AND_BUNDLER_ENDPOINT,
              },
            }
            if (address) {
              return (
                <Transaction
                  capabilities={capabilities}
                  chainId={84532}
                  contracts={contracts}
                  onError={onError}
                  onSuccess={onSuccess}
                >
                <TransactionButton className="w-[180px]"/>
                  <TransactionSponsor />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              )
            } else {
              return (
                <Wallet>
                  <ConnectWallet>
                    <Avatar className="h-6 w-6" />
                    <Name />
                  </ConnectWallet>
                </Wallet>
              )
            }
          }}
        </TransactionWrapper>
      </App>
    )
}

export default TransactionDemo;