/* eslint-disable max-len */
import * as React from 'react';
import VerifyIcon from './svg/verify';
import ESignIcon from './svg/esign';
import MobilePeer from './svg/mobile_peer';
import { IntlContext } from '../../components/intl';
import './styles/tools.css';

interface IToolsProps {
  name: any;
}

export class Tools extends React.Component<IToolsProps> {
  static contextType = IntlContext;

  context!: React.ContextType<typeof IntlContext>;

  render() {
    const { intl } = this.context;

    return (
      <div className="container_content">
        <div className="tools-panel">
          <div className="card">
            <VerifyIcon className="icon" />
            <div className="">
              <h4>{intl('tools.verify')}</h4>
              <br />
              <small>{intl('tools.verify.desc')}</small>
            </div>
          </div>
          <div className="card">
            <ESignIcon className="icon" />
            <div className="">
              <h4>{intl('tools.esign')}</h4>
              <br />
              <small>{intl('tools.esign.desc')}</small>
            </div>
          </div>
          <div className="card">
            <MobilePeer className="icon" />
            <div className="">
              <h4>{intl('tools.mobile')}</h4>
              <br />
              <small>{intl('tools.mobile.desc')}</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
