/* eslint-disable import/no-cycle */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
import {
  ipcMain,
  shell,
  IpcMainEvent,
  BrowserWindow,
  nativeTheme,
} from 'electron';
import { APP_LOG_FILE } from './constants';
import { l10n } from './l10n';
import logger, { loggingSwitch, loggingAnalyticsSwitch } from './logger';
import { setConfig, getConfig } from './config';
import { autoUpdater } from './updater';

export const sendToRenderers = (channel: string, data?: any) => {
  const browserWindows = BrowserWindow.getAllWindows();

  browserWindows.forEach((window) => {
    if (window.webContents) {
      window.webContents.send(channel, data);
    }
  });
};

const initEvents = () => {
  ipcMain
    .on('ipc-logging-open', () => {
      shell.openPath(APP_LOG_FILE);
    })
    .on('ipc-logging-status-get', (event: IpcMainEvent) => {
      const config = getConfig();

      event.returnValue = config.logging;
    })
    .on('ipc-logging-status-change', (event: IpcMainEvent) => {
      const config = getConfig();
      const value = !config.logging;

      setConfig({
        ...config,
        logging: value,
      });

      loggingSwitch(value);

      logger.info('logging', 'Logging status changed', {
        value,
      });

      event.sender.send('ipc-logging-status-changed', value);
    })
    .on('ipc-language-set', (_: IpcMainEvent, lang: string) => {
      l10n.setLang(lang);

      sendToRenderers('ipc-language-changed', l10n.lang);
    })
    .on('ipc-language-get', (event: IpcMainEvent) => {
      event.returnValue = {
        lang: l10n.lang,
        data: l10n.data,
        list: l10n.supportedLangs,
      };
    })
    .on('ipc-telemetry-status-get', (event: IpcMainEvent) => {
      const config = getConfig();

      event.returnValue = config.telemetry;
    })
    .on('ipc-telemetry-status-change', (event: IpcMainEvent) => {
      const config = getConfig();
      const value = !config.telemetry;

      setConfig({
        ...config,
        telemetry: value,
      });

      loggingAnalyticsSwitch(value);

      logger.info('telemetry', 'Telemetry status changed', {
        value,
      });

      event.sender.send('ipc-telemetry-status-changed', value);
    })
    .on('ipc-theme-get', (event: IpcMainEvent) => {
      event.returnValue = nativeTheme.themeSource;
    })
    .on(
      'ipc-theme-set',
      (event: IpcMainEvent, theme: 'system' | 'dark' | 'light') => {
        const config = getConfig();

        setConfig({
          ...config,
          theme,
        });

        nativeTheme.themeSource = theme;
        event.sender.send('ipc-theme-changed', theme);
      },
    )
    .on('ipc-theme-get', (event: IpcMainEvent) => {
      event.returnValue = nativeTheme.themeSource;
    })
    .on('ipc-priority-set', (event: IpcMainEvent, priority: PriorityType) => {
      const config = getConfig();

      setConfig({
        ...config,
        urgency: priority,
      });

      logger.info('notification', 'Notification priority changed', {
        urgency: priority,
      });

      // nativeTheme.themeSource = theme;
      event.sender.send('ipc-priority-changed', priority);
    })
    .on('ipc-sounds-set', (event: IpcMainEvent) => {
      const config = getConfig();
      const value = !config.notificationSound;

      setConfig({
        ...config,
        notificationSound: value,
      });

      logger.info('notification', 'Notification settings changed', {
        notificationSound: value,
      });

      // nativeTheme.themeSource = theme;
      event.sender.send('ipc-sounds-changed', value);
    })
    .on('ipc-priority-get', (event: IpcMainEvent) => {
      const config = getConfig();
      event.returnValue = config.urgency;
    })
    .on('ipc-sounds-get', (event: IpcMainEvent) => {
      const config = getConfig();
      event.returnValue = config.notificationSound;
    })
    .on('ipc-startup-set', (event: IpcMainEvent) => {
      const config = getConfig();
      const value = !config.runAtStartup;
      setConfig({
        ...config,
        runAtStartup: value,
      });

      logger.info('application', 'Application startup settings changed', {
        runAtStartup: value,
      });

      event.sender.send('ipc-startup-changed', value);
    })
    .on('ipc-host-set', (event: IpcMainEvent, hostUrl: string) => {
      const config = getConfig();

      setConfig({
        ...config,
        hostUrl,
      });

      logger.info('application', 'Application host url changed', {
        hostUrl,
      });

      event.sender.send('ipc-host-changed', hostUrl);
    })
    .on('ipc-startup-get', (event: IpcMainEvent) => {
      const config = getConfig();
      event.returnValue = config.runAtStartup;
    })
    .on('ipc-host-get', (event: IpcMainEvent) => {
      const config = getConfig();
      event.returnValue = config.hostUrl;
    })
    .on('ipc-update-check', () => {
      autoUpdater.checkForUpdates();
    })
    .on('error', (event: IpcMainEvent) => {
      logger.error('ipc-messages', 'Event error', {
        event: event.toString(),
      });
    });
};

export const ipcMessages = {
  initEvents,
};
