import * as React from 'react';
import Logo from './svg/logo';
import { IntlContext } from '../../components/intl';
import './styles/about.css';

interface IAboutProps {
  name: any;
  version: string;
}

// eslint-disable-next-line react/prefer-stateless-function
export class About extends React.Component<IAboutProps> {
  static contextType = IntlContext;

  render() {
    return (
      <div className="container_content">
        <div className="about-panel">
          <div className="about">
            <div className="logo">
              <Logo />
            </div>
            <div className="easy">E A S Y <sup>&reg;</sup></div>
            <div className="version">Sürüm 1.0.48 - 21.06.2021</div>
            <div className="thanks">&hearts;&nbsp;<small>Bu uygulama açık kaynaklı yazılımlar sayesinde geliştirilmiştir.</small>&nbsp;&hearts;</div>
          </div>
          <div className="footer">
            <div className="copyright">© 2021 Lyfe Dijital Yazılım Ticaret A.Ş. Her hakkı saklıdır.</div>
            <div className="links">
              <a href="https://imza.io">Kullanım Koşulları</a>
              &nbsp;-&nbsp;
              <a href="https://imza.io">Gizlilik Bildirimi</a>
              &nbsp;-&nbsp;
              <a href="https://imza.io">Hizmet Sözleşmesi</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
