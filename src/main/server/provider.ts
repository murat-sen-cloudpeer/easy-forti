/* eslint-disable import/extensions */
/* eslint-disable prefer-destructuring */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-plusplus */
/* eslint-disable max-len */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-self-assign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { Config } from '@webcrypto-local/cards';
import * as core from '@webcrypto-local/core';
import * as fs from 'fs';
import * as graphene from 'graphene-pk11';
import { Crypto } from 'node-webcrypto-p11';
import * as os from 'os';
import {
  Key, ObjectClass, SlotFlag,
} from 'graphene-pk11';
import { X509Certificate } from '@peculiar/x509';
import { LogData, LogHandler, LogLevel } from '@webcrypto-local/core';
import { Convert } from 'pvtsutils';
import { DEFAULT_HASH_ALG } from './const';
import { Pkcs11Crypto, PvCrypto } from './crypto';
import { CryptoMap } from './crypto_map';
import { WebCryptoLocalError } from './error';
import { digest } from './helper';
import { MapChangeEvent } from './map';
import {
  Card, CardLibraryType, CardWatcher, PCSCCard,
} from './pcsc';
import { ConfigTemplateBuilder } from './template_builder';
import { CardSession } from '../../@types/pcsclite';
import { SignatureRequest } from '../../@types/connection';
import logger from '../logger';

export interface IServerProvider {
  /**
   * Path to PKCS#11 lib
   */
  lib: string;
  /**
   * indexes of using slots. Default [0]
   */
  slots?: number[];
  libraryParameters?: string;
  /**
   * Custom name of provider
   */
  name?: string;
}

export interface IProviderConfig {
  /**
   * List of addition providers
   */
  providers?: IServerProvider[];
  /**
   * Path to card.json
   */
  cardConfigPath: string;
  pvpkcs11?: string[];
  opensc?: string;
  /**
   * Disable using of PCSC
   */
  disablePCSC?: boolean;
  /**
   * Additional cards
   */
  cards: Card[];
}

interface IAddProviderParams {
  name?: string;
}

type LocalProviderTokenHandler = (info: core.TokenInfoEvent) => void;
type LocalProviderTokenNewHandler = (info: PCSCCard) => void;
type LocalProviderListeningHandler = (info: core.IModule[]) => void;
type LocalProviderErrorHandler = (e: Error) => void;
type LocalProviderStopHandler = () => void;

function pauseAsync(ms: number = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class LocalProvider extends core.EventLogEmitter {
  public source = 'provider';

  public crypto: CryptoMap;

  public cardSessions: CardSession[] = [];

  public cards?: CardWatcher;

  public config: IProviderConfig;

  /**
   *
   * @param config Config params
   */
  constructor(config: IProviderConfig) {
    super();

    this.config = config;
    if (!config.disablePCSC) {
      this.cards = new CardWatcher({
        cards: config.cards,
        pvpkcs11: config.pvpkcs11,
        opensc: config.opensc,
      });
    }
    this.crypto = new CryptoMap()
      .on('add', this.onCryptoAdd.bind(this))
      .on('remove', this.onCryptoRemove.bind(this));
  }

  public on(event: 'info', listener: LogHandler): this;

  public on(event: 'new-token', listener: (card: PCSCCard)=>void): this;

  public on(event: 'insert-token', listener: (cardSessions: CardSession[])=>void): this;

  public on(event: 'remove-token', listener: (cardSessions: CardSession[])=>void): this;

  public on(event: 'update-token', listener: (providerInfos: core.ProviderCrypto[])=>void): this;

  public on(event: 'error', listener:(error: WebCryptoLocalError|Error, data?: any)=>void): this;

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);

    return this;
  }

  public emit(event: 'info', level: LogLevel, source: string, message: string, data?: LogData): boolean;

  public emit(event: 'new-token', card: PCSCCard): boolean;

  public emit(event: 'insert-token', cardSessions: CardSession[]): boolean;

  public emit(event: 'remove-token', cardSessions: CardSession[]): boolean;

  public emit(event: 'update-token', providerInfos: core.ProviderCrypto[]): boolean;

  public emit(event: 'error', error: WebCryptoLocalError, data?: any): boolean;

  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  public async open() {
    // #region System via pvpkcs11
    if (this.config.pvpkcs11) {
      for (const pvpkcs11 of this.config.pvpkcs11) {
        if (fs.existsSync(pvpkcs11)) {
          try {
            const crypto = new PvCrypto({
              library: pvpkcs11,
              slot: 0,
              readWrite: true,
            });

            crypto.isLoggedIn = true;
            this.addProvider(crypto);
          } catch (e) {
            this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_INIT, `Provider:open Cannot load library by path ${pvpkcs11}. ${e.message}`));
          }
        } else {
          this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_INIT, `Provider:open Cannot find pvpkcs11 by path ${pvpkcs11}`));
        }
      }
    }
    // #endregion

    // #region Add providers from config list
    this.config.providers = this.config.providers || [];
    for (const prov of this.config.providers) {
      prov.slots = prov.slots || [0];
      for (const slot of prov.slots) {
        if (fs.existsSync(prov.lib)) {
          try {
            const crypto = new Pkcs11Crypto({
              library: prov.lib,
              libraryParameters: prov.libraryParameters,
              slot,
              readWrite: true,
            });
            this.addProvider(crypto, {
              name: prov.name,
            });
          } catch (err) {
            this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_INIT, `Provider:open Cannot load PKCS#11 library by path ${prov.lib}. ${err.message}`));
          }
        } else {
          this.log('info', `File ${prov.lib} does not exist`, { action: 'open' });
        }
      }
    }
    // #endregion

    // #region Add pkcs11
    if (this.cards) {
      this.cards
        .on('error', (err) => {
          this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.TOKEN_COMMON, err.message), err);
        })
        .on('info', (level, source, message, data) => {
          this.emit('info', level, source, message, data);
        })
        .on('new', (card) => this.emit('new-token', card))
        .on('insert', this.onTokenInsert.bind(this))
        .on('remove', this.onTokenRemove.bind(this))
        .start(this.config.cardConfigPath);
    }
    // #endregion
  }

  public addProvider(crypto: Crypto, params?: IAddProviderParams) {
    const info = getSlotInfo(crypto);

    this.log('info', 'PKCS#11 library information', {
      library: crypto.session.slot.module.libFile,
      manufacturerId: crypto.session.slot.module.manufacturerID,
      cryptokiVersion: crypto.session.slot.module.cryptokiVersion,
      libraryVersion: crypto.session.slot.module.libraryVersion,
      firmwareVersion: crypto.session.slot.firmwareVersion,
    });

    if (params?.name) {
      info.name = info.name;
      info.card = params.name;
    }
    this.crypto.add(info.id, crypto);
  }

  public hasProvider(slot: graphene.Slot) {
    return this.crypto.some((crypto) => {
      const cryptoModule: graphene.Module = (crypto as any).module;
      const cryptoSlot: graphene.Slot = (crypto as any).slot;
      if (cryptoModule.libFile === slot.module.libFile
        && cryptoSlot.handle.equals(slot.handle)) {
        return true;
      }

      return false;
    });
  }

  public stop() {
    this.crypto.removeAllListeners();
    this.crypto.clear();
    this.cards?.stop();
  }

  public async getCrypto(cryptoID: string) {
    const crypto = this.crypto.item(cryptoID);
    if (!crypto) {
      throw new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_CRYPTO_NOT_FOUND, `Cannot get crypto by given ID '${cryptoID}'`);
    }

    return crypto;
  }

  public async onTokenInsert(card: Card) {
    this.log('info', 'Token was added to the reader', {
      reader: card.reader,
      name: card.name,
      atr: card.atr?.toString('hex') || 'unknown',
    });

    for (const lib of card.libraries) {
      const library = typeof lib === 'string'
        ? lib
        : lib.path;
      const type: CardLibraryType = typeof lib === 'string' ? 'config' : lib.type;
      try {
        this.log('info', 'Loading PKCS#11 library', {
          library,
        });
        if (!fs.existsSync(library)) {
          this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_CRYPTO_NOT_FOUND, `Cannot load PKCS#11 library. File '${library}' does not exist`));
          continue;
        }

        await pauseAsync(200);
        let mod: graphene.Module | undefined;
        try {
          mod = graphene.Module.load(library, card.name);
        } catch (err) {
          this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_CRYPTO_WRONG, err.message), library);
          continue;
        }

        try {
          await pauseAsync();
          mod.initialize();
        } catch (err) {
          if (!/CRYPTOKI_ALREADY_INITIALIZED/.test(err.message)) {
            this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_CRYPTO_WRONG, err.message), library);
            continue;
          }
        }

        const slots = mod.getSlots(true);
        if (!slots.length) {
          this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.PROVIDER_CRYPTO_WRONG, `No slots found. It's possible token ${card.atr ? card.atr.toString('hex') : 'unknown'} uses wrong PKCS#11 lib ${card.libraries}`));
          continue;
        }
        const slotIndexes: number[] = [];
        this.log('info', 'Looking for slot', {
          slots: slots.length,
        });
        for (let i = 0; i < slots.length; i++) {
          const slot = slots.items(i);
          if (!slot || this.hasProvider(slot)) {
            continue;
          }
          if (os.platform() === 'win32'
            && /pvpkcs11\.dll$/.test(slot.lib.libPath)
            && slot.slotDescription !== card.reader) {
            // NOTE:  pvpkcs11 implementation has only one slot for MiniDriver
            // Use only slot where slotDescription equals to reader name
            continue;
          }
          slotIndexes.push(i);
        }
        if (!slotIndexes.length) {
          // lastError = `Cannot find matching slot for '${card.reader}' reader`;
          continue;
        }

        const addInfos: CardSession[] = [];
        slotIndexes.forEach((slotIndex) => {
          try {
            const crypto = new Pkcs11Crypto({
              library,
              name: card.name,
              slot: slotIndex,
              readWrite: !card.readOnly,
            });
            if (type === 'config') {
              this.log('info', 'Use ConfigTemplateBuilder', card.config);
              crypto.templateBuilder = new ConfigTemplateBuilder(card.config || new Config());
            } else {
              this.log('info', 'Use default TemplateBuilder');
            }
            const cardSessions = getCardSessions(crypto, card);
            cardSessions.forEach((s) => {
              addInfos.push(s);
              this.cardSessions.push(s);
            });
            this.addProvider(crypto);
          } catch (err) {
            this.emit('error', err);
          }
        });

        // fire token event
        this.emit('insert-token', addInfos);

        break;
      } catch (err) {
        continue;
      }
    }
    await pauseAsync(200);
    this.emit('update-token', this.cardSessions.map((s) => {
      const info = getSlotInfo(s.crypto);
      info.atr = Convert.ToHex(s.card.atr || Buffer.alloc(0));
      info.library = s.crypto.module.libName;
      info.id = s.providerId;

      return info;
    }));
    await pauseAsync();
  }

  public async onTokenRemove(card: Card) {
    try {
      this.log('info', 'Token was removed from the reader', {
        reader: card.reader,
        name: card.name,
        atr: card.atr?.toString('hex') || 'unknown',
      });

      // #region Find slots from removed token
      const cryptoIDs: string[] = [];
      for (const lib of card.libraries) {
        const library = typeof lib === 'string'
          ? lib
          : lib.path;
        try {
          await pauseAsync();
          const mod = graphene.Module.load(library, card.name);
          try {
            mod.initialize();
          } catch (err) {
            if (!/CRYPTOKI_ALREADY_INITIALIZED/.test(err.message)) {
              throw err;
            }
          }

          // #region Look for removed slots
          // const slots = mod.getSlots(false);
          this.crypto.forEach((crypto) => {
            const cryptoModule: graphene.Module = (crypto as any).module;
            if (cryptoModule.libFile === mod.libFile) {
              // if (slots.indexOf(cryptoSlot) === -1) {
              cryptoIDs.push(crypto.info.id);
              // }
            }
          });
          // #endregion
        } catch (err) {
          this.emit('error', new WebCryptoLocalError(
            WebCryptoLocalError.CODE.TOKEN_REMOVE_TOKEN_READING,
            `Cannot find removed slot in PKCS#11 library ${library}. ${err.message}`,
          ));
        }
      }

      if (!cryptoIDs.length) {
        this.emit('error', new WebCryptoLocalError(WebCryptoLocalError.CODE.TOKEN_REMOVE_NO_SLOTS_FOUND));
      }
      // #endregion
      const removeSessions: CardSession[] = [];

      cryptoIDs.forEach((provId) => {
        this.crypto.forEach((c) => {
          this.cardSessions = this.cardSessions.filter((s) => {
            if (s.crypto.info.id === c.info.id) {
              removeSessions.push(s);

              return false;
            }

            return true;
          });
        });
        this.crypto.remove(provId);
      });
      // fire token event
      if (removeSessions.length) {
        this.emit('remove-token', removeSessions);
      }
    } catch (error) {
      this.emit('error', error);
    }
    this.emit('update-token', this.cardSessions.map((s) => {
      const info = getSlotInfo(s.crypto);
      info.atr = Convert.ToHex(s.card.atr || Buffer.alloc(0));
      info.library = s.crypto.module.libName;
      info.id = s.providerId;

      return info;
    }));
    await pauseAsync();
  }

  protected onCryptoAdd(e: MapChangeEvent<Pkcs11Crypto>) {
    this.log('info', 'Crypto provider was added to the list', {
      id: e.key,
      library: e.item.module.libFile,
      name: e.item.info.name,
      reader: e.item.info.reader,
    });
  }

  protected onCryptoRemove(e: MapChangeEvent<Pkcs11Crypto>) {
    const cryptoModule = e.item.module;
    this.log('info', 'Crypto provider was removed from the list', {
      id: e.key,
    });

    if (!this.crypto.some((crypto: any) => crypto.slot && crypto.slot.module.libFile === cryptoModule.libFile)) {
      this.log('info', 'Finalize crypto provider', {
        id: e.key,
      });
      try {
        cryptoModule.finalize();
      } catch (err) {
        this.emit('error', err);
      }
    }
  }

  public getSigningCertificates(identityNo:string) {
    const result:string[] = [];
    this.cardSessions.forEach((s) => {
      if (s.identityNo === identityNo) {
        result.push(s.certificate.toString('base64'));
      }
    });

    return result;
  }

  public sign(identityNo:string, request: SignatureRequest, pin: string) {
    try {
      const result:CardSession[] = [];

      this.cardSessions.forEach((s) => {
        if (s.identityNo === identityNo) {
          result.push(s);
        }
      });

      if (!result || result.length === 0) {
        throw new Error('Nitelikli elektronik imza sertifikası bulunamadı!');
      }

      const card = result[0];
      if (card.crypto.slot.flags && SlotFlag.TOKEN_PRESENT) {
        let session: graphene.Session | undefined;

        try {
          session = card.crypto.slot.open();
          try {
            session.login(pin);
            const objects = session.find();

            logger.info('provider', 'Find private keys');
            let privateKey: Key | undefined;

            for (let i = 0; i < objects.length; i++) {
              const obj = objects.items(i);
              const key = obj.toType();
              if (key.class === ObjectClass.PRIVATE_KEY) {
                privateKey = key as Key;
              }
            }

            if (!privateKey) {
              throw new Error('Nitelikli elektronik imza sertifikası bulunamadı!');
            }

            // sign content
            const signedContent = session.createSign(request.signingAlghoritm, privateKey);
            signedContent.update(Buffer.from(request.contentHash, 'base64'));
            const signature = signedContent.final();

            return signature.toString('hex');
          } finally {
            session.logout();
          }
        } finally {
          session?.close();
        }
      } else {
        throw new Error('Slot is not initialized');
      }
    } catch (error) {
      logger.error('provider', error);
      throw error;
    }
  }
}

function getSlotInfo(p11Crypto: Crypto) {
  const { session } = p11Crypto as any;
  const { slot } = session;
  const info: core.ProviderCrypto = p11Crypto.info as any;
  info.token = slot.getToken();
  info.readOnly = !(session.flags & graphene.SessionFlag.RW_SESSION);

  return info;
}

function getSubjectProperty(subject: string, propertyName: string):string {
  const fields = subject.split(',');
  let result = '';
  fields.forEach((f) => {
    const s:string[] = f.trim().split('=');
    if (s[0] === propertyName) {
      result = s[1];
    }
  });

  return result;
}

function getCardSessions(p11Crypto: Pkcs11Crypto, card: Card): CardSession[] {
  const { session } = p11Crypto as any;
  const results: CardSession[] = [];

  const certObjects = session.find({
    class: ObjectClass.CERTIFICATE,
  });

  for (let c = 0; c < certObjects.length; c++) {
    const cert: any = certObjects.items(0).toType();
    const certValue = cert.value.toString('base64');
    const x509cert = new X509Certificate(certValue);
    const result = {
      crypto: p11Crypto,
      providerId: digest(DEFAULT_HASH_ALG, `${card.reader}${card.atr}${p11Crypto.slot.handle.toString()}`).toString('hex'),
      name: getSubjectProperty(x509cert.subject, 'CN'),
      card,
      slotInfo: p11Crypto.slot.slotDescription,
      identityNo: getSubjectProperty(x509cert.subject, '2.5.4.5'),
      issuer: x509cert.issuer,
      certificate: x509cert,
    };
    results.push(result);
  }

  return results;
}
