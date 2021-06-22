import * as React from 'react';
import Logo from './svg/logo';
import { IntlContext } from '../../components/intl';
import './styles/about.css';

interface IAboutProps {
  name: any;
  version: string;
  update: {
    isFetching: IsFetchingType;
    info?: UpdateInfoType;
  };
}

// eslint-disable-next-line react/prefer-stateless-function
export class About extends React.Component<IAboutProps> {
  static contextType = IntlContext;

  render() {
    const { intl } = this.context;

    return (
      <div className="container_content">
        <div className="about-panel">
          <div className="about">
            <div className="logo">
              <Logo />
            </div>
            <div className="easy">E A S Y <sup>&reg;</sup></div>
            <div className="version">{`${intl('version')} ${this.props?.version || '1.0.0. alpha'}`}</div>
            <div className="thanks">&hearts;&nbsp;<small>{intl('about.thanks')}</small>&nbsp;&hearts;</div>
          </div>
          <div className="footer">
            <div className="copyright">{`© 2021 Lyfe Dijital Yazılım Ticaret A.Ş. ${intl('about.copyright')}`}</div>
            <div className="links">
              <a href={intl('about.url.termsOfUse')}>{intl('about.termsOfUse')}</a>
              <span style={{ color: 'rgb(val(--black))' }}>&nbsp;&nbsp;&#8226;&nbsp;&nbsp;</span>
              <a href={intl('about.url.privacyStatement')}>{intl('about.privacyStatement')}</a>
              <span style={{ color: 'rgb(val(--black))' }}>&nbsp;&nbsp;&#8226;&nbsp;&nbsp;</span>
              <a href={intl('about.url.servicesAgreement')}>{intl('about.servicesAgreement')}</a>
            </div>
            <div className="license">
              <span>{intl('about.license.label')}</span>
              <br />
              <a rel="license" href={intl('about.license.url')}>
                <img
                  alt="Creative Commons License"
                  style={{ borderWidth: 0 }}
                  src="https://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png"
                />
              </a>
              <br />
              <a rel="license" style={{ textAlign: 'center' }} href={intl('about.license.url')}>{intl('about.license.name')}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
