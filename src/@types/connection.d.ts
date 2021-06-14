/* eslint-disable import/extensions */
/// <reference types="node" />
import { ServerOptions as HttpsServerOptions } from 'https';
import { X509Certificate } from '@peculiar/x509';
import { CardSession } from './pcsclite';

export interface ServerOptions extends HttpsServerOptions {
}

export interface ServerInfo {
  version: string;
  name: string;
  preKey: ProtobufString;
  providers?: WebCryptoProvider[];
}

export interface RequestSigningCert {
  messageId: string;
  identityNo: string;
  resolve: (messageId: string, signingCertInfos: string[]) => Promise<void>;
  error: (messageId: string, error: Error) => Promise<void>;
}

export interface RequestSignature {
  messageId: string;
  identityNo: string;
  signatureRequest: SignatureRequest;
  certificate?: X509Certificate;
  resolve: (messageId: string, signedData: string) => Promise<void>;
  reject: (messageId: string, reason: string) => Promise<void>;
  cancel: (message: string) => Promise<void>;
  error: (messageId: string, error: Error) => Promise<void>;
}

export interface SigningCertInfo {
  x509Cert: X509Certificate;
  index: number;
  name: string;
  atr: string;
  lib: string;
}

export interface Session {
  sessionId?: string;
  connectionId: string;
  clientId: string;
  sessionTime: Date;
  disconnected?: Date;
  cards: CardSession[];
}

export interface SignatureRequest {
  requestId: string;
  requestRef: string;
  requestedBy: string;
  requestedAt: Date;
  subject: string;
  fileName: string;
  fileId: string;
  contentHash: string;
  format: number;
  kind: number;
  counterSignature: boolean;
  signingAlghoritm: string;
}

export interface Notification {
  notificationId: string;
  notifyTime: Date;
  badge: string;
  icon: string;
  title: string;
  body: string;
  silent: boolean;
  requireInteraction: boolean;
  payload: string;
}

export interface NotificationInfo {
  identityNo: string;
  notification: Notification;
}

export {};
