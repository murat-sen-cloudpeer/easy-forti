/* eslint-disable max-classes-per-file */
/* eslint-disable import/no-extraneous-dependencies */
import { ObjectProto } from 'tsprotobuf';

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

export declare class CardReaderActionProto extends ActionProto {
  static INDEX: number;

  static ACTION: string;
}
