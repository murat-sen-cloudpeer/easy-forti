/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import { shell, MenuItemConstructorOptions, nativeImage } from 'electron';
import * as path from 'path';
import { ICON_DIR, TOOLS_LINK } from '../constants';
import { windowsController } from '../windows';
import { l10n } from '../l10n';
import { CardSession } from '../../@types/pcsclite';

export const baseTemplate = (): MenuItemConstructorOptions[] => [
  {
    label: l10n.get('about.app'),
    click: () => {
      windowsController.showPreferencesWindow('about');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('certificates.empty'),
    enabled: false,
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('requests.empty'),
    enabled: false,
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('preferences'),
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  },
  {
    label: l10n.get('tools'),
    click: () => {
      shell.openExternal(TOOLS_LINK);
    },
  },
  {
    type: 'separator',
  },
  {
    label: l10n.get('quit'),
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
    connecting: 'Bağlantı kuruluyor',
    connected: 'Çevrim içi',
    disconnected: 'Çevrim dışı',
  };

  result.push({
    label: connectionState[connectionStatus || 'disconnected'],
    type: 'normal',
    icon: nativeImage.createFromPath(path.join(ICON_DIR, `${connectionStatus || 'disconnected'}.png`)),
    enabled: connectionStatus === 'connected',
  });

  result.push({
    type: 'separator',
    sublabel: 'Bağlantı',
  });

  result.push({
    label: l10n.get('about.app'),
    click: () => {
      windowsController.showPreferencesWindow('about');
    },
  });

  result.push({
    label: l10n.get('preferences'),
    click: () => {
      windowsController.showPreferencesWindow('settings');
    },
  });

  result.push({
    label: l10n.get('tools'),
    click: () => {
      shell.openExternal(TOOLS_LINK);
    },
  });

  result.push({
    type: 'separator',
    sublabel: 'Sertifikalar',
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
      label: '(Sertifika bulunamadı)',
      type: 'normal',
      enabled: false,
    });
  }

  result.push({
    type: 'separator',
    sublabel: 'İmza Talepleri',
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
      label: '(Bekleyen talep yok)',
      type: 'normal',
      enabled: false,
    });
  }

  result.push({
    type: 'separator',
  });

  result.push({
    label: 'Çıkış',
    role: 'quit',
  });

  return result;
};
