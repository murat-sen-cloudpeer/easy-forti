/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable import/no-cycle */
import * as core from '@webcrypto-local/core';
import * as proto from '@webcrypto-local/proto';
import { LogHandler, LogLevel, LogData } from '@webcrypto-local/core';
import { Session } from '../../../@types/connection';
import { Server } from '../connection';
import { MemoryStorage } from '../memory_storage';
import { PCSCCard } from '../pcsc';
import { IProviderConfig, LocalProvider } from '../provider';
import { CryptoService } from './crypto';
import { Service } from './service';

import { WebCryptoLocalError } from '../error';
// eslint-disable-next-line import/extensions
import { CardSession } from '../../../@types/pcsclite';

export interface ProviderNotifyEvent {
  type: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

export type ProviderNotifyEventHandler = (e: ProviderNotifyEvent) => void;

export class ProviderService extends Service<LocalProvider> {
  public source = 'provider-service';

  public memoryStorage = new MemoryStorage();

  constructor(server: Server, options: IProviderConfig) {
    super(server, new LocalProvider(options), [
      // #region List of actions
      proto.ProviderInfoActionProto,
      proto.ProviderGetCryptoActionProto,
      // #endregion
    ]);

    const crypto = new CryptoService(server, this);
    this.addService(crypto);

    // #region Connect events
    this.object.on('new-token', this.onNewToken.bind(this));
    this.object.on('remove-token', this.onRemoveToken.bind(this));
    crypto.on('notify', this.onNotify.bind(this));
    // #endregion
  }

  // #region Events
  public on(event: 'info', listener: LogHandler): this;

  public on(event: 'error', listener:(error: WebCryptoLocalError|Error, data?: any)=>void): this;

  public on(event: string, cb: (...args: any[]) => void): this;

  public on(event: string, cb: (...args: any[]) => void): this {
    return super.on(event, cb);
  }

  public emit(event: 'error', error: Error): boolean;

  public emit(event: 'info', level: core.LogLevel, source: string, message: string, data?: core.LogData): boolean;

  public emit(event: string, ...args: any[]): boolean;

  public emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  // #endregion

  public open() {
    this.object.open()
      .catch((err) => {
        this.emit('error', err);
      });
  }

  public close() {
    this.object.crypto.clear();
  }

  public getProvider() {
    return this.object;
  }

  protected onNewToken(e: PCSCCard) {
    this.emit('token_new', e);
  }

  protected onNotify(e: ProviderNotifyEvent) {
    this.emit('notify', e);
  }

  protected async onMessage(session: Session, action: proto.ActionProto): Promise<proto.ResultProto> {
    return new proto.ResultProto(undefined);
  }

  protected async onRemoveToken(removedSessions: CardSession[]) {
    removedSessions.forEach((s) => this.memoryStorage.removeByProvider(s.providerId));
  }
}
