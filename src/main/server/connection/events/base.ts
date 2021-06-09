/* eslint-disable import/no-cycle */
import { Event } from '@webcrypto-local/core';
import { Server } from '../server';

export class ServerEvent extends Event<Server> { }
