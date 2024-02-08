import type { FramePostUntrustedData as XmtpUntrustedData } from '@xmtp/frames-validator';
import { NeynarFrameValidationInternalModel } from '../utils/neynar/frame/types';
import { validateFramesPost } from '@xmtp/frames-validator';

/**
 * Frame Data
 *
 * Note: exported as public Type
 */
export interface FrameData {
  buttonIndex: number;
  castId: {
    fid: number;
    hash: string;
  };
  inputText: string;
  fid: number;
  messageHash: string;
  network: number;
  timestamp: number;
  url: string;
}

/**
 * Frame Request
 *
 * Note: exported as public Type
 */
export interface FrameRequest {
  untrustedData: FrameData | XmtpUntrustedData;
  trustedData: {
    messageBytes: string;
  };
}

/**
 * Simplified Object model with the raw Neynar data if-needed.
 */
export interface FarcasterValidationData {
  button: number; // Number of the button clicked
  following: boolean; // Indicates if the viewer clicking the frame follows the cast author
  input: string; // Text input from the viewer typing in the frame
  interactor: {
    fid: number; // Viewer Farcaster ID
    custody_address: string; // Viewer custody address
    verified_accounts: string[]; // Viewer account addresses
  };
  liked: boolean; // Indicates if the viewer clicking the frame liked the cast
  raw: NeynarFrameValidationInternalModel;
  recasted: boolean; // Indicates if the viewer clicking the frame recasted the cast
  valid: boolean; // Indicates if the frame is valid
}

export type XmtpValidationData = Awaited<ReturnType<typeof validateFramesPost>>['actionBody'] & {
  verifiedWalletAddress: string;
};

export type FrameValidationData = XmtpValidationData | FarcasterValidationData;

export type FrameValidationResponse =
  | { isValid: true; message: XmtpValidationData; clientType: 'xmtp' }
  | { isValid: true; message: FarcasterValidationData; clientType: 'farcaster' }
  | { isValid: false; message: undefined };

export function convertToFrame(json: any) {
  return {
    fid: json.fid,
    url: json.frameActionBody?.url.toString(),
    messageHash: json.messageHash,
    timestamp: json.timestamp,
    network: json.network,
    buttonIndex: json.frameActionBody?.buttonIndex,
    castId: {
      fid: json.frameActionBody?.castId?.fid,
      hash: json.frameActionBody?.castId?.hash,
    },
  };
}

export type FrameButtonMetadata =
  | {
      action: 'link' | 'mint';
      label: string;
      target: string;
    }
  | {
      action?: 'post' | 'post_redirect';
      label: string;
    };

export type FrameInputMetadata = {
  text: string;
};

/**
 * Frame Request
 *
 * Note: exported as public Type
 */
export type FrameMetadataType = {
  buttons?: [FrameButtonMetadata, ...FrameButtonMetadata[]];
  image: string;
  input?: FrameInputMetadata;
  post_url?: string;
  refresh_period?: number;
};

/**
 * Frame Metadata Response
 *
 * Note: exported as public Type
 */
export type FrameMetadataResponse = Record<string, string>;
