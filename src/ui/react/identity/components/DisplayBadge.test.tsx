import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAttestations } from '../../../../core-react/identity/hooks/useAttestations';
import { useIdentityContext } from '../../../../core-react/identity/providers/IdentityProvider';
import { useOnchainKit } from '../../../../core-react/useOnchainKit';
import { Badge } from './Badge';
import { DisplayBadge } from './DisplayBadge';

function mock<T>(func: T) {
  return func as Mock;
}

vi.mock('../../../../core-react/useOnchainKit', () => ({
  useOnchainKit: vi.fn(),
}));
vi.mock('../../../../core-react/identity/hooks/useAttestations', () => ({
  useAttestations: vi.fn(),
}));
vi.mock('../../../../core-react/identity/providers/IdentityProvider', () => ({
  useIdentityContext: vi.fn(),
}));

const useIdentityContextMock = mock(useIdentityContext);
const useOnchainKitMock = mock(useOnchainKit);
const useAttestationsMock = mock(useAttestations);

describe('DisplayBadge', () => {
  const testIdentityProviderAddress = '0xIdentityAddress';
  const testDisplayBadgeComponentAddress = '0xDisplayBadgeAddress';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if neither contextSchemaId nor schemaId is provided', () => {
    useOnchainKitMock.mockReturnValue({
      chain: 'test-chain',
      schemaId: null,
    });
    useIdentityContextMock.mockReturnValue({
      schemaId: null,
      address: testIdentityProviderAddress,
    });
    useAttestationsMock.mockReturnValue([]);

    expect(() =>
      render(
        <DisplayBadge>
          <Badge />
        </DisplayBadge>,
      ),
    ).toThrow(
      'Name: a SchemaId must be provided to the OnchainKitProvider or Identity component.',
    );
  });

  it('should return null if attestations are empty', () => {
    useOnchainKitMock.mockReturnValue({
      chain: 'test-chain',
      schemaId: 'test-schema-id',
    });
    useIdentityContextMock.mockReturnValue({
      schemaId: null,
      address: testIdentityProviderAddress,
    });
    useAttestationsMock.mockReturnValue([]);

    const { container } = render(
      <DisplayBadge>
        <Badge />
      </DisplayBadge>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render children if attestations are not empty', () => {
    useOnchainKitMock.mockReturnValue({
      chain: 'test-chain',
      schemaId: 'test-schema-id',
    });
    useIdentityContextMock.mockReturnValue({
      schemaId: null,
      address: testIdentityProviderAddress,
    });
    useAttestationsMock.mockReturnValue(['attestation1']);

    render(
      <DisplayBadge>
        <Badge />
      </DisplayBadge>,
    );
    expect(screen.getByTestId('ockBadge')).toBeInTheDocument();
  });

  it('use identity context address if provided', () => {
    useIdentityContextMock.mockReturnValue({
      address: testIdentityProviderAddress,
    });

    render(
      <DisplayBadge>
        <Badge />
      </DisplayBadge>,
    );

    expect(useAttestations).toHaveBeenCalledWith({
      address: testIdentityProviderAddress,
      chain: 'test-chain',
      schemaId: 'test-schema-id',
    });
  });

  it('use component address over identity context if both are provided', () => {
    useIdentityContextMock.mockReturnValue({
      address: testIdentityProviderAddress,
    });

    render(
      <DisplayBadge address={testDisplayBadgeComponentAddress}>
        <Badge />
      </DisplayBadge>,
    );

    expect(useAttestations).toHaveBeenCalledWith({
      address: testDisplayBadgeComponentAddress,
      chain: 'test-chain',
      schemaId: 'test-schema-id',
    });
  });
});
