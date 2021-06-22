/* eslint-disable jsx-a11y/label-has-associated-control */
import * as React from 'react';
import {
  Select,
  Switch,
  Button,
  SelectChangeEvent,
} from 'lib-react-components';
import { IntlContext } from '../../components/intl';
import { ISO_LANGS } from '../../conts';
import './styles/settings.css';

interface ISettingsProps {
  name: any;
  language: {
    onLanguageChange: (lang: string) => void;
  };
  theme: {
    value: ThemeType;
    onThemeChange: (theme: ThemeType) => void;
  };
  notification: {
    priority: PriorityType;
    sounds: boolean;
    onPriorityChange: (priority: PriorityType) => void;
    onSoundsChange: () => void;
  };
  logging: {
    onLoggingOpen: () => void;
    onLoggingStatusChange: () => void;
    status: boolean;
  };
  telemetry: {
    onTelemetryStatusChange: () => void;
    status: boolean;
  };
  application: {
    onRunAtStartupChange: () => void;
    onHostUrlChange: (url: string) => void;
    runAtStartup: boolean;
    hostUrl: string;
  };
}

export class Settings extends React.Component<ISettingsProps> {
  static contextType = IntlContext;

  context!: React.ContextType<typeof IntlContext>;

  handleChangeLanguage = (event: SelectChangeEvent) => {
    const { language } = this.props;
    const { value } = event.target;

    language.onLanguageChange(value as string);
  };

  handleChangeTheme = (event: SelectChangeEvent) => {
    const { theme } = this.props;
    const { value } = event.target;

    theme.onThemeChange(value as ThemeType);
  };

  handleChangePriority = (event: SelectChangeEvent) => {
    const { notification } = this.props;
    const { value } = event.target;

    notification.onPriorityChange(value as PriorityType);
  };

  handleChangeHostUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { application } = this.props;
    const { value } = event.target;

    application.onHostUrlChange(value);
  };

  render() {
    const {
      telemetry, logging, theme, notification, application,
    } = this.props;
    const { list, lang, intl } = this.context;

    return (
      <div className="settings-panel">
        <div className="row">
          <div className="card box">
            <label htmlFor="lang">
              <span className="label">{intl('settings.language')}</span>
              <Select
                name="lang"
                className="input"
                defaultValue={lang}
                size="large"
                bgType="stroke"
                color="grey_2"
                onChange={this.handleChangeLanguage}
                options={list.map((value) => {
                  const isoLang = ISO_LANGS[value];

                  return {
                    value,
                    label: isoLang ? isoLang.nativeName : value,
                  };
                })}
              />
            </label>
          </div>
          <div className="card box">
            <label htmlFor="theme">
              <span className="label">{intl('settings.theme')}</span>
              <Select
                name="theme"
                className="input"
                size="large"
                bgType="stroke"
                color="grey_2"
                defaultValue={theme.value}
                onChange={this.handleChangeTheme}
                options={['system', 'light', 'dark'].map((value) => ({
                  value,
                  label: intl(`settings.theme.${value}`),
                }))}
              />
            </label>
          </div>
        </div>
        <div className="row box">
          <small>{intl('settings.notifications')}</small>
          <div className="card">
            <label htmlFor="priority">
              <span className="label">{intl('settings.notifications.priority')}</span>
              <Select
                name="priority"
                className="input"
                size="large"
                bgType="stroke"
                color="grey_2"
                defaultValue={notification.priority}
                onChange={this.handleChangePriority}
                options={['trivial', 'normal', 'important'].map((value) => ({
                  value,
                  label: intl(`settings.notifications.priority.${value}`),
                }))}
              />
            </label>
          </div>
          <div className="card">
            <label htmlFor="notifySound">
              <span className="label">{intl('settings.notifications.sounds')}</span>
              <Switch
                name="notifySound"
                colorOn="primary"
                color="grey_2"
                iconColor="grey_1"
                checked={notification.sounds}
                onCheck={notification.onSoundsChange}
              />
            </label>
          </div>
        </div>
        <div className="row box">
          <small>Kullanım ve Hata Verileri</small>
          <div className="card">
            <label htmlFor="telemetry">
              <span className="label">{intl('settings.telemetry')}</span>
              <Switch
                name="telemetry"
                colorOn="primary"
                color="grey_2"
                iconColor="grey_1"
                checked={telemetry.status}
                onCheck={telemetry.onTelemetryStatusChange}
              />
            </label>
            <p>{intl('settings.telemetry.enable')}</p>
          </div>
          <div className="card">
            <label htmlFor="logging">
              <span className="label">{intl('settings.logging')}</span>
              <Switch
                name="logging"
                colorOn="primary"
                color="grey_2"
                iconColor="grey_1"
                checked={logging.status}
                onCheck={logging.onLoggingStatusChange}
              />
            </label>
            <Button
              bgType="clear"
              textColor="primary"
              size="small"
              onClick={logging.onLoggingOpen}
            >
              {intl('settings.logging.display')}
            </Button>
          </div>
        </div>
        <div className="row box">
          <small>{intl('settings.application')}</small>
          <div className="card">
            <label htmlFor="startup">
              <span className="label">{intl('settings.application.startup')}</span>
              <Switch
                name="startup"
                colorOn="primary"
                color="grey_2"
                iconColor="grey_1"
                checked={application.runAtStartup}
                onCheck={application.onRunAtStartupChange}
              />
            </label>
          </div>
          <div className="card">
            <label htmlFor="host" data-component="text_field" data-disabled="false" className="text_field field">
              <div data-component="input" data-type="stroke" data-disabled="false" className="input">
                <input
                  className="input_field round_small input_field_large stroke_grey_2 input_field_focus_primary fill_white text_black input_placeholder_color_grey_4"
                  type="url"
                  placeholder={intl('settings.application.host')}
                  aria-describedby={intl('settings.application.host')}
                  value={application.hostUrl}
                  onChange={this.handleChangeHostUrl}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }
}
