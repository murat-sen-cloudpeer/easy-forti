/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable class-methods-use-this */
import * as proto from '@webcrypto-local/proto';
import { Convert } from 'pvtsutils';
import { LogLevel } from '@microsoft/signalr';
import { Session } from '../../../@types/connection';
import { Server } from '../connection';

import { WebCryptoLocalError } from '../error';
import { PCSCWatcher, PCSCWatcherEvent } from '../pcsc';
import { Service } from './service';

export class CardReaderService extends Service<PCSCWatcher> {
  constructor(server: Server) {
    super(server, new PCSCWatcher(), [
      proto.CardReaderGetReadersActionProto,
    ]);

    // #region Connect to PCSC events
    this.object.on('insert', this.onInsert.bind(this));
    this.object.on('remove', this.onRemove.bind(this));
    this.object.on('ready', () => this.emit('ready'));
    // #endregion
  }

  public start() {
    this.object.start();
  }

  public stop() {
    this.object.stop();
  }

  protected onInsert(e: PCSCWatcherEvent) {
    const eventProto = this.createProto(proto.CardReaderInsertEventProto, e);

    this.log('info', 'cardReader/insert', {
      atr: e.atr?.toString('hex') || 'empty',
      reader: e.reader.name,
    });

    this.emit('info', LogLevel.Information, 'card_reader', 'cardReader/insert', e);
    // this.server.send(this.server.session, eventProto);
  }

  protected onRemove(e: PCSCWatcherEvent) {
    this.server.session.cards.forEach((session) => {
      const eventProto = this.createProto(proto.CardReaderRemoveEventProto, e);

      this.log('info', 'cardReader/remove', {
        atr: e.atr?.toString('hex') || 'empty',
        reader: e.reader.name,
      });

      this.emit('info', LogLevel.Information, 'card_reader', 'cardReader/remove', e);
      // this.server.send(this.server.session, eventProto);
    });
  }

  protected async onMessage(session: Session, action: proto.ActionProto) {
    const result = new proto.ResultProto(action);
    switch (action.action) {
      case proto.CardReaderGetReadersActionProto.ACTION: {
        this.log('info', 'cardReader/getReaders');

        result.data = Convert.FromString(JSON.stringify(this.object.readers));
        break;
      }
      default:
        throw new WebCryptoLocalError(WebCryptoLocalError.CODE.ACTION_NOT_IMPLEMENTED, `Action '${action.action}' is not implemented`);
    }

    return result;
  }

  protected createProto(cls: typeof proto.CardReaderInsertEventProto | typeof proto.CardReaderRemoveEventProto, e: PCSCWatcherEvent) {
    return new cls(e.reader.name, !e.atr ? 'unknown' : e.atr.toString('hex'));
  }
}
