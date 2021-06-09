/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-param-reassign */
import { Notification } from 'electron';
import * as core from '@webcrypto-local/core';
import { PCSCCard } from './pcsc';
import { IProviderConfig, LocalProvider } from './provider';
import { CardReaderService } from './services/card_reader';
import { tray } from '../tray/index';
import logger from '../logger';
import { ServerOptions, Session, Notification as Notify } from '../../@types/connection';
import { Server } from './connection';
import { icons } from '../constants/files';

export interface IServerOptions extends ServerOptions {
  config: IProviderConfig;
  /**
   * Disables using of PCSC. No emit CardReader and Provider token events
   */
  disablePCSC?: boolean;
}

/**
 * Local server
 *
 * @export
 * @class LocalServer
 * @extends {EventEmitter}
 */
export class EasyHub extends core.EventLogEmitter {
  public source = 'server';

  /**
   * Server
   *
   * @type {Server}
   * @memberof EasyHub
   */
  public server: Server;

  public session!: Session;

  public provider: LocalProvider;

  public cardReader?: CardReaderService;

  constructor(options: IServerOptions) {
    super();

    // esig.hub websocket
    this.server = new Server(options)
      // bağlantı kesildi
      .on('disconnect', (e) => {
        tray.setOnline('disconnected');
      })
      // bağlantı kuruldu
      .on('connect', (e) => {
        tray.setOnline('connected');
      })
      .on('request-signing-cert', (request) => {
        try {
          const signCerts = this.provider.getSigningCertificates(request.identityNo);
          request.resolve(request.messageId, signCerts);
        } catch (err) {
          request.reject(request.messageId, err);
        }
      })
      .on('request-signature', (request) => {
        try {
          const signedData = this.provider.sign(request.identityNo, request.signatureRequest, '8284');
          request.resolve(request.messageId, signedData);
        } catch (err) {
          request.reject(request.messageId, err);
        }
      })
      .on('notify', (notification) => {
        const appNotice = new Notification({
          title: notification.title,
          body: notification.body,
          icon: icons.favicon,
          silent: notification.silent,
        });
        appNotice.show();
      });

    if (!options.disablePCSC) {
      this.cardReader = new CardReaderService(this.server)
        .on('ready', () => {
          this.provider.open();
        })
        .on('info', (level, source, message, data) => {
          logger.info('server', 'card-reader info', {
            level, source, message, data,
          });
          // this.emit('info', level, source, message, data);
        })
        .on('new', (card: PCSCCard) => {
          logger.info('server', 'card-reader new-card', card);
          // this.emit('new', card);
        })
        .on('token', (info: any) => {
          logger.info('server', 'card-reader token-info', info);
          // this.emit('info', level, source, message, data);
        })
        .on('error', (e) => {
          logger.error('server', 'card-reader error', e);
          // this.emit('error', e);
        });
    } else {
      // Disable PCSC for provider too
      options.config.disablePCSC = true;
    }

    // smartcard
    this.provider = new LocalProvider(options.config)
      .on('insert-token', (e) => {
        logger.info('server', 'insert-token', e.map((c) => ({
          identityNo: c.identityNo,
          issuer: c.issuer,
          name: c.name,
          slotInfo: c.slotInfo,
        })));
        // tray.setCertificates(this.provider.cardSessions);
        // this.server.setSessions(this.provider.cardSessions);
      })
      .on('remove-token', (e) => {
        logger.info('server', 'remove-token', e.map((c) => ({
          identityNo: c.identityNo,
          issuer: c.issuer,
          name: c.name,
          slotInfo: c.slotInfo,
        })));
        // tray.setCertificates(this.provider.cardSessions);
        // this.server.setSessions(this.provider.cardSessions);
      })
      .on('update-token', () => {
        logger.info('server', 'update-token', this.provider.cardSessions.map((c) => ({
          identityNo: c.identityNo,
          issuer: c.issuer,
          name: c.name,
          slotInfo: c.slotInfo,
        })));
        tray.setCertificates(this.provider.cardSessions);
        this.server.setSessions(this.provider.cardSessions);
      });
  }

  public close(callback?: () => void) {
    if (this.cardReader) {
      this.cardReader.stop();
    }

    this.server.close(() => {
      if (callback) {
        callback();
      }
    });

    return this;
  }

  public start(address: string) {
    this.server.connect(address);

    if (this.cardReader) {
      this.cardReader.start();
    }

    return this;
  }

  public on(event: string, cb: (...args: any[]) => void) {
    return super.on(event, cb);
  }
}
