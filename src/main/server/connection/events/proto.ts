/* eslint-disable max-classes-per-file */
/* eslint-disable import/no-extraneous-dependencies */
import { ObjectProto } from 'tsprotobuf';
import { Certificate } from '../../crypto/openssl/pki/cert';

export declare class BaseProto extends ObjectProto {
  static INDEX: number;

  version: number;
}

export declare class ActionProto extends BaseProto {
  static INDEX: number;

  static ACTION: string;

  /**
     * name of the action
     */
  action: string;

  /**
     * Identity of action (needs to link request to response)
     */
  actionId: string;

  constructor();
}

export declare class ResultProto extends ActionProto {
  static INDEX: number;

  constructor(proto?: ActionProto);
}

export declare class CertificateRequestProto extends ActionProto {
  identityNo: string;
}

export declare class CertificateResultProto extends ResultProto {
  identityNo: string;

  Certificates: Certificate[];
}

export declare class SignatureRequestProto extends ActionProto {
  requestId: string;

  requestRef: string;

  identityNo: string;

  subject: string;

  sourceFileName: string;

  format: number;

  kind: number;

  contentHash: string;
}

export declare class SignatureResultProto extends ResultProto {
  requestId: string;

  signedData: string;
}
