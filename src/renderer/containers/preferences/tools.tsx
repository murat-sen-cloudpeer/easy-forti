/* eslint-disable max-len */
import * as React from 'react';
import VerifyIcon from './svg/verify';
import ESignIcon from './svg/esign';
import MobilePeer from './svg/mobile-peer';
import { IntlContext } from '../../components/intl';
import './styles/tools.css';

interface IToolsProps {
  name: any;
  update: {
    isFetching: IsFetchingType;
    info?: UpdateInfoType;
  };
}

export class Tools extends React.Component<IToolsProps> {
  static contextType = IntlContext;

  context!: React.ContextType<typeof IntlContext>;

  render() {
    return (
      <div className="container_content">
        <div className="tools-panel">
          <div className="card">
            <VerifyIcon className="icon" />
            <div className="">
              <h4>Elektronik İmza Doğrulama</h4>
              <br />
              <small>Dosya veya dokümanların elektronik imza doğrulamasını yapabilirsiniz.</small>
            </div>
          </div>
          <div className="card">
            <ESignIcon className="icon" />
            <div className="">
              <h4>Elektronk İmzalama</h4>
              <br />
              <small>İstediğiniz bir dosya veya dokümanı elektronik olarak imzalayabilirsiniz.</small>
            </div>
          </div>
          <div className="card">
            <MobilePeer className="icon" />
            <div className="">
              <h4>imza.io Mobil Eşleştirme</h4>
              <br />
              <small>imza.io Mobil uygulaması ile bilgisayarınıza gelen imza taleplerini görebilir, uzaktan imza atabilirsiniz.</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
