import * as React from 'react';
import * as ReactDOM from 'react-dom';
import WindowProvider from '../../components/window_provider';
import Container from './container';
import { ISignatureWindowParams } from '../../../main/windows/windows_controller';

class Root extends WindowProvider<{}, {}> {
  renderChildrens() {
    return (
      <Container
        onClose={this.close}
        params={this.params as ISignatureWindowParams}
      />
    );
  }
}

ReactDOM.render(
  <Root />,
  document.getElementById('root'),
);
