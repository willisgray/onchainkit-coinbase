import { useFundCardFundingUrl } from '../hooks/useFundCardFundingUrl';
import { FundButton } from './FundButton';
import { useFundContext } from './FundCardProvider';

export function FundCardSubmitButton() {
  const {
    fundAmountFiat,
    fundAmountCrypto,
    submitButtonState,
    setSubmitButtonState,
    buttonText,
  } = useFundContext();

  const fundingUrl = useFundCardFundingUrl();

  return (
    <FundButton
      disabled={!fundAmountFiat && !fundAmountCrypto}
      hideIcon={submitButtonState === 'default'}
      text={buttonText}
      className="w-full"
      fundingUrl={fundingUrl}
      state={submitButtonState}
      onClick={() => setSubmitButtonState('loading')}
      onPopupClose={() => setSubmitButtonState('default')}
    />
  );
}
