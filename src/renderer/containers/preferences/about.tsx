import * as React from 'react';
import { Typography } from 'lib-react-components';
import { IntlContext } from '../../components/intl';

const s = require('./styles/about.sass');

interface IAboutProps {
  name: any;
  version: string;
}

// eslint-disable-next-line react/prefer-stateless-function
export class About extends React.Component<IAboutProps> {
  static contextType = IntlContext;

  render() {
    const { version } = this.props;
    const { intl } = this.context;

    return (
      <div className={s.root}>
        <div>
          <Typography
            type="b3"
          >
            <a href="https://imza.io">imza.io</a> {intl('by')} <a href="https://cloudpeer.com.tr">Cloudpeer</a>
          </Typography>
          <Typography
            type="b3"
          >
            {intl('version')} {version}
          </Typography>
          <br />
          <Typography
            type="b3"
          >
            {intl('made.with')}
          </Typography>
          <Typography
            type="b3"
          >
            {intl('copyright')}. {intl('all.rights')}.
          </Typography>
        </div>
        <div>
          <img
            src="../static/icons/logo.svg"
            alt="imza.io logo"
            width="38"
          />
        </div>
      </div>
    );
  }
}
