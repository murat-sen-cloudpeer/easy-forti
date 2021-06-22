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
              <a href="https://imza.io">{intl('about.termsOfUse')}</a>
              &nbsp;-&nbsp;
              <a href="https://imza.io">{intl('about.privacyStatement')}</a>
              &nbsp;-&nbsp;
              <a href="https://imza.io">{intl('about.servicesAgreement')}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
