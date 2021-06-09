/* eslint-disable import/extensions */
/* eslint-disable import/named */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
/* eslint-disable import/no-extraneous-dependencies */
import * as proto from '@webcrypto-local/proto';
import { Session } from '../../../../@types/connection';
import { Server } from '../server';
import { ServerEvent } from './base';
import { ActionProto, ResultProto } from './proto';

export class ServerMessageEvent extends ServerEvent {
  public message: ActionProto;

  public session: Session;

  public resolve: (result: ResultProto) => void;

  public reject: (error: Error) => void;

  constructor(target: Server, session: Session, message: proto.ActionProto, resolve: () => void, reject: (error: Error) => void) {
    super(target, 'message');
    this.message = message;
    this.session = session;
    this.resolve = resolve;
    this.reject = reject;
  }
}
