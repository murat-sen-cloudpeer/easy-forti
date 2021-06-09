/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import { Menu, Tray } from 'electron';
import { icons } from '../constants/files';
import logger from '../logger';
import { getMenuItems } from './base_template';
import { developmentTemplate } from './development_template';
import { CardSession } from '../../@types/pcsclite';
import { isDevelopment } from '../constants';

let trayElectron: Electron.Tray;
let connectionStatus: 'connecting' | 'connected' | 'disconnected';
let certificates: CardSession[];
let tasks: string[];

const getTemplate = () => (
  getMenuItems(connectionStatus, certificates, tasks)
    .concat(isDevelopment ? developmentTemplate() : [])
);

const setIcon = () => {
  // const icon = NativeImage.createFromPath(icons.tray);
  // icon.setTemplateImage(true);
  if (icons?.tray) {
    trayElectron.setImage(icons.tray);
  }
};

const create = () => {
  if (!trayElectron && icons?.tray) {
    trayElectron = new Tray(icons.tray);
  }

  const menu = Menu.buildFromTemplate(getTemplate());
  trayElectron.setToolTip('imza.io EASY');
  trayElectron.setContextMenu(menu);
};

const refresh = () => {
  create();
};

const setOnline = (status: 'connecting' | 'connected' | 'disconnected'):void => {
  try {
    connectionStatus = status;
    refresh();
  } catch (error) {
    logger.error('tray', error);
  }
};

const setCertificates = (signatureCertificates: CardSession[]):void => {
  try {
    certificates = signatureCertificates;
    refresh();
  } catch (error) {
    logger.error('tray', error);
  }
};

const setTasks = (requests: string[]) => {
  try {
    tasks = requests;
    refresh();
  } catch (error) {
    logger.error('tray', error);
  }
};

export const tray = {
  create,
  refresh,
  setIcon,
  setOnline,
  setCertificates,
  setTasks,
};
