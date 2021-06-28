/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import { MenuItemConstructorOptions, nativeImage } from 'electron';
import * as path from 'path';
import { ICON_DIR } from '../constants';
import { windowsController } from '../windows';
import { l10n } from '../l10n';
import { CardSession } from '../../@types/pcsclite';

export const baseTemplate = (): MenuItemConstructorOptions[] => [
  {
    label: l10n.get('tray.about'),
    click: () => {
      windowsController.showPreferencesWindow('about');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('tray.certificates.empty'),
    enabled: false,
    click: () => {

    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('tray.requests.empty'),
    enabled: false,
    click: () => {
      windowsController.showPreferencesWindow('requests');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('tray.settings'),
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  },
  {
    label: l10n.get('tray.tools'),
    click: () => {
      windowsController.showPreferencesWindow('tools');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('tray.quit'),
    role: 'quit',
  },
];

export const getMenuItems = (
  connectionStatus: 'connecting' | 'connected' | 'disconnected',
  signatureCertificates: CardSession[],
  tasks: string[],
): MenuItemConstructorOptions[] => {
  const result: any[] = [];
  const connectionState: Record<
  (string & 'connecting') | 'connected' | 'disconnected',
  string
  > = {
    connecting: l10n.get('tray.connecting'),
    connected: l10n.get('tray.online'),
    disconnected: l10n.get('tray.offline'),
  };

  result.push({
    label: l10n.get(connectionState[connectionStatus || 'disconnected']),
    type: 'normal',
    icon: nativeImage.createFromPath(path.join(ICON_DIR, `${connectionStatus || 'disconnected'}.png`)),
    enabled: connectionStatus === 'connected',
  });

  result.push({
    type: 'separator',
    sublabel: l10n.get("tray")
  });

  result.push({
    label: l10n.get('tray.about'),
    click: () => {
      windowsController.showPreferencesWindow('about');
    },
  });

  result.push({
    label: l10n.get('tray.settings'),
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  });

  result.push({
    label: l10n.get('tray.tools'),
    click: () => {
      windowsController.showPreferencesWindow('tools');
    },
  });

  result.push({
    type: 'separator',
    sublabel: l10n.get("tray.certificates"),
  });

  if (signatureCertificates && signatureCertificates.length > 0) {
    signatureCertificates.forEach((c) => {
      result.push({
        label: `${c.name} (${c.identityNo})`,
        sublabel: c.slotInfo,
        enabled:
          new Date(c.certificate.notBefore) <= new Date()
          && new Date() <= new Date(c.certificate.notAfter),
        type: 'normal',
      });
    });
  } else {
    result.push({
      label: l10n.get("tray.certificates.empty"),
      type: 'normal',
      enabled: false,
    });
  }

  result.push({
    type: 'separator',
    sublabel: l10n.get("tray.requests"),
  });

  if (tasks && tasks.length > 0) {
    tasks.forEach((c: any) => {
      result.push({
        label: c as string,
        sublabel: '',
        type: 'normal',
      });
    });
  } else {
    result.push({
      label: l10n.get("tray.requests.empty"),
      type: 'normal',
      enabled: false,
      click: () => {
        windowsController.showPreferencesWindow('requests');
      },
    });
  }

  result.push({
    type: 'separator',
  });

  result.push({
    label: l10n.get("tray.quit"),
    role: 'quit',
  });

  return result;
};
