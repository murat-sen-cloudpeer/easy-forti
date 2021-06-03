import {
  shell,
  MenuItemConstructorOptions,
} from 'electron';
import { TOOLS_LINK } from '../constants';
import { windowsController } from '../windows';
import { autoUpdater } from '../updater';
import { l10n } from '../l10n';

export const baseTemplate = (): MenuItemConstructorOptions[] => ([
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
]);
