/* eslint-disable no-shadow */
/* eslint-disable import/no-duplicates */
/* eslint-disable max-len */
/* eslint-disable import/named */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/extensions */
/* eslint-disable import/no-cycle */
/* eslint-disable import/no-extraneous-dependencies */
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import * as core from '@webcrypto-local/core';
import { ServerOptions as HttpsServerOptions } from 'https';
import logger from '../../logger';
import { getConfig } from '../../config';
import connection, {
  NotificationInfo, RequestSignature, RequestSigningCert, SignatureRequest, Notification,
} from '../../../@types/connection';
import { ServerListeningEvent } from './events/listening';
import { ServerDisconnectEvent } from './events/disconnect';
import { ServerErrorEvent } from './events/error';
import { ServerMessageEvent } from './events/message';
import {
  CertificateRequestProto, CertificateResultProto, SignatureRequestProto, SignatureResultProto,
} from './events/proto';
import { CardSession } from '../../../@types/pcsclite';
import { Session } from '../../../@types/connection';
import { X509Certificate } from '../crypto/openssl/pki/x509';

/**
 * Https/wss server based on 2key-ratchet protocol
 * - generates Identity
 * - store makes PreKey bundle
 * - Stores secure sessions
 *
 * @export
 * @class Server
 * @extends {EventEmitter}
 */
export class Server extends core.EventLogEmitter {
  public source = 'server';

  public info: connection.ServerInfo = {
    version: '1.0.0',
    name: 'webcrypto-socket',
    preKey: '',
    providers: [
      {
        algorithms: [
          {
            name: 'RSASSA-PKCS1-v1_5',
            usages: ['generateKey', 'exportKey', 'importKey', 'sign', 'verify'],
          },
          {
            name: 'RSA-OAEP',
            usages: [
              'generateKey',
              'exportKey',
              'importKey',
              'encrypt',
              'decrypt',
              'wrapKey',
              'unwrapKey',
            ],
          },
          {
            name: 'RSA-PSS',
            usages: ['generateKey', 'exportKey', 'importKey', 'sign', 'verify'],
          },
          {
            name: 'ECDSA',
            usages: ['generateKey', 'exportKey', 'importKey', 'sign', 'verify'],
          },
          {
            name: 'ECDH',
            usages: [
              'generateKey',
              'exportKey',
              'importKey',
              'deriveKey',
              'deriveBits',
            ],
          },
          {
            name: 'AES-CBC',
            usages: [
              'generateKey',
              'exportKey',
              'importKey',
              'encrypt',
              'decrypt',
              'wrapKey',
              'unwrapKey',
            ],
          },
          {
            name: 'AES-GCM',
            usages: [
              'generateKey',
              'exportKey',
              'importKey',
              'encrypt',
              'decrypt',
              'wrapKey',
              'unwrapKey',
            ],
          },
          {
            name: 'AES-KW',
            usages: [
              'generateKey',
              'exportKey',
              'importKey',
              'wrapKey',
              'unwrapKey',
            ],
          },
          { name: 'SHA-1', usages: ['digest'] },
          { name: 'SHA-256', usages: ['digest'] },
          { name: 'SHA-384', usages: ['digest'] },
          { name: 'SHA-512', usages: ['digest'] },
          {
            name: 'PBKDF2',
            usages: ['generateKey', 'importKey', 'deriveKey', 'deriveBits'],
          },
        ],
        name: 'OpenSSL',
      },
    ],
  };

  public session: connection.Session = {
    sessionId: undefined,
    connectionId: '',
    clientId: getConfig().userId,
    sessionTime: new Date(),
    disconnected: undefined,
    cards: [],
  };

  protected connection!: HubConnection;

  private url!: string;

  private pendingSession: connection.Session | null = null;

  protected options: HttpsServerOptions;

  constructor(options: connection.ServerOptions) {
    super();

    this.options = options;
  }

  public on(event: 'request-signature', listener: (request: RequestSignature) => void): this;

  public on(event: 'request-signing-cert', listener: (request: RequestSigningCert) => void): this;

  public on(event: 'connect', listener: (session?: Session) => void): this;

  public on(event: 'disconnect', listener: (error?: Error) => void): this;

  public on(event: 'notify', listener: (notification: Notification) => void): this;

  public on(event: 'info', cb: core.LogHandler): this;

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  public emit(event: 'request-signature', request: RequestSignature): boolean;

  public emit(event: 'request-signing-cert', request: RequestSigningCert): boolean;

  public emit(event: 'connect', session?: Session): boolean;

  public emit(event: 'disconnect', error?: Error): boolean;

  public emit(event: 'notify', notification: Notification): boolean;

  public emit(event: 'info', level: core.LogLevel, source: string, message: string, data?: core.LogData): boolean;

  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  public once(
    event: string | symbol,
    listener: (...args: any[]) => void,
  ): this {
    return super.once(event, listener);
  }

  public async setSessions(cardSessions: CardSession[]):Promise<void> {
    await this.syncSessions(this.session.clientId, cardSessions.map((c) => c.identityNo));
    this.session.cards = cardSessions;
  }

  public connect(address: string) {
    this.url = address;

    this.connection = new HubConnectionBuilder()
      .withUrl(address)
      .configureLogging(LogLevel.Trace)
      .build();

    this.connection.onclose((error) => {
      this.pendingSession = this.session;
      this.session.disconnected = new Date();

      logger.warn('connection', 'connection closed', error);
      this.emit('disconnect', error);

      this.start();
    });

    this.connection.on('RequestSigningCert', (messageId: string, identityNo: string) => this.requestSigningCert(messageId, identityNo));
    this.connection.on('RequestSignature', (messageId: string, identityNo: string, signatureRequest: SignatureRequest) => this.requestSignature(messageId, identityNo, signatureRequest));
    this.connection.on('Notify', (messageId:string, notificationInfo: NotificationInfo) => this.notify(messageId, notificationInfo));
    this.start();

    return this;
  }

  private notify(messageId: string, notificationInfo: NotificationInfo) {
    logger.info('io', 'notify', { messageId, notificationInfo });

    this.emit('notify', notificationInfo.notification);
  }

  private requestSigningCert(messageId: string, identityNo: string) {
    logger.info('io', 'request-signing-cert', { messageId, identityNo });

    this.emit('request-signing-cert', {
      messageId,
      identityNo,
      resolve: (messageId, signCertificates) => this.replySigningCert(messageId, signCertificates),
      error: (messageId, error) => this.replyError(messageId, error),
    });
  }

  private requestSignature(messageId: string, identityNo: string, signatureRequest: SignatureRequest) {
    logger.info('io', 'request-signature', { messageId, identityNo, signatureRequest });
    const requestSignature: RequestSignature = {
      messageId,
      identityNo,
      signatureRequest,
      resolve: async (messageId, signedData) => this.replySignature(messageId, signedData),
      reject: (messageId, reason) => this.replyReject(messageId, reason),
      cancel: (messageId) => this.replyCancel(messageId),
      error: (messageId, error) => this.replyError(messageId, error),
    };

    this.session.cards.forEach((c) => {
      requestSignature.certificate = c.certificate;
    });

    this.emit('request-signature', requestSignature);
  }

  private async start() {
    try {
      if (this.connection.state === HubConnectionState.Disconnected) {
        logger.info('connection', 'establishing connection...');
        await this.connection.start();
      } else if (this.connection.state !== HubConnectionState.Connected) {
        setTimeout(() => this.start(), 5000);
      }

      const recover = !!this.session.disconnected;
      this.session.connectionId = this.connection.connectionId as string;
      this.session.sessionTime = recover ? this.session.sessionTime : new Date();
      this.session.disconnected = undefined;

      // socket bağlantısı kurulmadan önce gelen sertifika bilgileri bağlantı
      // kurulunca gönderilir.
      await this.setSessions(this.session.cards);
      logger.info('io', `connection ${recover ? 'recovered' : 'established'}`, { connectionId: this.connection.connectionId });
      this.emit('connect', this.session);
    } catch (error) {
      logger.error('connection not established', error);
      this.emit(
        'disconnect', error,
      );
      setTimeout(() => this.start(), 5000);
    }
  }

  public async syncSessions(clientId:string, identities: string[]): Promise<void> {
    logger.info('connection', 'sync identities', identities);

    if (this.connection.state === HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SyncSessions',
          getConfig().userId.toString(),
          identities);
      } catch (error) {
        logger.error('connection', error);
      }
    }
  }

  public async replySigningCert(messageId: string, signCertificates: string[]): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        this.connection.invoke('ReplySigningCert', messageId, signCertificates)
          .then((r: any) => {
            logger.info('io', r);
            resolve();
          })
          .catch((e: any) => {
            logger.error('io', e);
            reject();
          });
      });
    } catch (err) {
      logger.error('io', err.message, err);
    }
  }

  public async replySignature(messageId: string, signedData: string): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        this.connection.invoke('ReplySignature', messageId, signedData)
          .then((r: any) => {
            logger.info('io', r);
            resolve();
          })
          .catch((e: any) => {
            logger.error('io', e);
            reject(e);
          });
      });
    } catch (err) {
      logger.error('io', err.message, err);
    }
  }

  public async replyReject(messageId: string, reason: string): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        this.connection.invoke('ReplyReject', messageId, reason)
          .then((r: any) => {
            logger.info('io', r);
            resolve();
          })
          .catch((e: any) => {
            logger.error('io', e);
            reject();
          });
      });
    } catch (err) {
      logger.error('io', err.message, err);
    }
  }

  public async replyCancel(messageId: string): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        this.connection.invoke('ReplyCancel', messageId)
          .then((r: any) => {
            logger.info('io', r);
            resolve();
          })
          .catch((e: any) => {
            logger.error('io', e);
            reject();
          });
      });
    } catch (err) {
      logger.error('io', err.message, err);
    }
  }

  public async replyError(messageId: string, error: Error): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        this.connection.invoke('ReplyError', messageId, error)
          .then((r: any) => {
            logger.info('io', r);
            resolve();
          })
          .catch((e: any) => {
            logger.error('io', e);
            reject();
          });
      });
    } catch (err) {
      logger.error('io', err.message, err);
    }
  }

  public close(_callback?: () => void) {
    return this;
  }
}
