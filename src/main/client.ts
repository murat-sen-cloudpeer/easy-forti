import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { getConfig } from './config';
import { SERVICE_URL } from './constants';
import logger from './logger';

class SocketService {
  private connection: HubConnection;

  private url: string;

  private sessionId: string = null;

  private pendingSession: SignatureCertificate[] = null;

  private signatureCertificates: SignatureCertificate[] = [];

  constructor() {
    this.url = SERVICE_URL;
    this.connection = new HubConnectionBuilder()
      .withUrl(this.url)
      .configureLogging(LogLevel.Trace)
      .build();

    this.connection.onclose(() => {
      logger.warn('client', 'connection closed');
      this.start();
    });

    this.start();
  }

  private async start() {
    try {
      logger.info('client', 'establishing connection...');
      // eventHub.emit('status', 'connecting');
      await this.connection.start();

      if (this.sessionId != null) {
        // var olan bir bağlantı koptuysa sunucu tarafında yeni bağlantı ile sertifika bilgileri ilişkilendirilmeli
        await this.connection.invoke('RecoverSession', this.sessionId);
        logger.info('client', 'connection recovered');
      } else {
        // socket bağlantısı kurulmadan önce gelen sertifika bilgileri bağlantı kurulunca gönderilir.
        logger.info('client', 'connection established');
        if (this.pendingSession != null && this.pendingSession.length > 0) {
          this.createSession(this.pendingSession);
        }
      }

      // eventHub.emit('status', 'connected');

      this.connection.on(
        'GetSignatureCertificate',
        (id: any, identityNo: string) => {
          try {
            const certs = this.signatureCertificates
              .filter(
                (c: SignatureCertificate) => getIdentity(c) === identityNo,
              )
              .map((c) => c.cert);
            if (!certs && certs.length == 0) {
              throw new Error(
                'Nitelikli elektronik imza sertifikası bulunamadı!',
              );
            }
            this.connection
              .invoke('GetSignatureCertificateResult', id, certs)
              .then((r: any) => logger.info(r))
              .catch((e: any) => logger.error(e));
          } catch (e) {
            logger.error(e);
            this.connection.invoke('ErrorResult', id, e.toString());
          }
        },
      );

      this.connection.on('Sign', async (request: any) => {
        try {
          console.log(this.signatureCertificates);
          console.log(request);
          const certs = this.signatureCertificates.filter(
            (c: SignatureCertificate) => getIdentity(c) === request.identityNo,
          );
          if (!certs && certs.length == 0) {
            throw new Error(
              'Nitelikli elektronik imza sertifikası bulunamadı!',
            );
          }
          const signRequest: any = {
            ...request,
            certificate: certs[0].x509cert,
            lib: certs[0].lib,
          };
          logger.info(signRequest);
          eventHub.emit('sign-request', signRequest);
        } catch (e) {
          logger.error(e);
          this.connection.invoke(
            'ErrorResult',
            request.requestId,
            e.toString(),
          );
        }
      });
      /*
      eventHub.on('SignResult', (requestId, result) => {
        this.connection.invoke(
          'SignResult',
          requestId,
          result?.toString('base64'),
        );
      });

      eventHub.on('ErrorResult', (requestId, error) => {
        this.connection.invoke('ErrorResult', requestId, error.toString());
      });
      */
    } catch (error) {
      logger.error('client', 'connection not established', error);
      // eventHub.emit("status", "disconnected");
      setTimeout(() => this.start(), 5000);
    }
  }

  // public createSession(identities: string[]):void {
  public createSession(certificates: SignatureCertificate[]): void {
    const identities = certificates.map((c: SignatureCertificate) => getIdentity(c));
    this.pendingSession = certificates;
    logger.info(identities);

    this.connection.state == HubConnectionState.Connected
      && this.connection
        .invoke('CreateSession', {
          SessionType: 1,
          Identities: identities,
          ClientId: config.get('clientId'),
        })
        .then((sessionId) => {
          this.sessionId = sessionId;
          this.pendingSession = null;
          this.signatureCertificates = certificates;
          logger.info(sessionId);
        })
        .catch((error) => logger.error(error));
  }

  public on(
    event: string | symbol,
    listener: { (status: any): void; (...args: any[]): void },
  ): void {
    eventHub.addListener(event, listener);
  }

  public off(event: string | symbol, listener: (...args: any[]) => void): void {
    if (event) {
      eventHub.removeListener(event, listener);
    } else {
      eventHub.removeAllListeners();
    }
  }
}

export default SocketService;
