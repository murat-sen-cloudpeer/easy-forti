/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-param-reassign */
import { Notification, Dialog, dialog } from 'electron';
import * as core from '@webcrypto-local/core';
import { PCSCCard } from './pcsc';
import { IProviderConfig, LocalProvider } from './provider';
import { CardReaderService } from './services/card_reader';
import { tray } from '../tray/index';
import logger from '../logger';
import { ServerOptions, Session, Notification as Notify } from '../../@types/connection';
import { Server } from './connection';
import { icons } from '../constants/files';
import { windowsController } from '../windows';

export interface IServerOptions extends ServerOptions {
  config: IProviderConfig;
  /**
   * Disables using of PCSC. No emit CardReader and Provider token events
   */
  disablePCSC: boolean;
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
      .on('request-signing-cert', async (request) => {
        try {
          const signCerts = this.provider.getSigningCertificates(request.identityNo);
          await request.resolve(request.messageId, signCerts);
        } catch (err) {
          await request.error(request.messageId, err);
        }
      })
      .on('request-signature', (request) => {
        windowsController.showSignatureWindow(
          {
            request,
            onSign: async (pin: string) => new Promise<void>((resolve, reject) => {
              try {
                const signedData = this.provider.sign(request.identityNo, request.signatureRequest, pin);

                request.resolve(request.messageId, signedData).then(() => {
                  dialog.showMessageBox({
                    type: 'info',
                    buttons: ['ok'],
                    message: `${request.signatureRequest.requestRef} referans numaralı doküman başarıyla imzalandı!`,
                  });
                  resolve();
                }).catch((err) => {
                  dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['ok'],
                    message: err.message,
                  }).then(() => reject(err));
                });
              } catch (err) {
                dialog.showMessageBox({
                  type: 'warning',
                  buttons: ['ok'],
                  message: err.message === 'CKR_USER_NOT_LOGGED_IN' ? 'Hatalı PIN kodu girdiniz' : 'Bir hata oluştu',
                  detail: err.message,
                }).then(() => reject(err));
              }
            }),
            onCancel: async () => new Promise<void>((resolve, reject) => {
              request.cancel(request.messageId).then(() => resolve()).catch((err) => reject(err));
            }),
            onError: async (error: Error) => new Promise<void>((resolve, reject) => {
              request.error(request.messageId, error).then(() => resolve()).catch((err) => reject(err));
            }),
          },
        ).catch((error) => {
          logger.error('server', error.message, error);
          request.error(request.messageId, error);
        });
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
        });
      /*
        .on('info', (level: any, source: any, message: any, data: any) => {
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
        */
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
      .on('update-token', async () => {
        logger.info('server', 'update-token', this.provider.cardSessions.map((c) => ({
          identityNo: c.identityNo,
          issuer: c.issuer,
          name: c.name,
          slotInfo: c.slotInfo,
        })));
        tray.setCertificates(this.provider.cardSessions);
        await this.server.setSessions(this.provider.cardSessions);
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

  public async start(address: string) {
    await this.server.connect(address);

    this.cardReader?.start();

    return this;
  }

  public on(event: string, cb: (...args: any[]) => void) {
    return super.on(event, cb);
  }
}
