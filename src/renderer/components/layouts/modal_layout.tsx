/* eslint-disable react/no-array-index-key */
import * as React from 'react';
import { Button, CircularProgress } from 'lib-react-components';
import { IntlContext } from '../intl';

const s = require('./styles/modal_layout.sass');

export interface IModalLayoutProps {
  children: React.ReactNode;
  title: (string | React.ReactNode)[];
  onReject?: () => void;
  onApprove: () => void;
  onCancel: () => void;
  textReject?: string;
  textApprove?: string;
  inProgress: boolean;
  isValid: boolean;
}

export default class ModalLayout extends React.Component<IModalLayoutProps> {
  static contextType = IntlContext;

  renderButtons() {
    const {
      onReject,
      onApprove,
      onCancel,
      textReject,
      textApprove,
      inProgress,
      isValid,
    } = this.props;
    const { intl } = this.context;

    return (
      <div className="modal-buttons">
        <Button
          size="large"
          className={s.button}
          bgType="stroke"
          color="grey_4"
          textColor="primary"
          key={onReject ? 'reject' : 'cancel'}
          onClick={() => (onReject ? onReject() : onCancel())}
        >
          {textReject || (onReject ? intl('reject') : intl('cancel'))}
        </Button>
        <Button
          size="large"
          className={s.button}
          disabled={!isValid}
          color="primary"
          textColor="black"
          key="approve"
          onClick={onApprove}
        >
          {inProgress ? <CircularProgress colorProgress="white" size={30} style={{ marginTop: 4 }} /> : textApprove || intl('ok')}
        </Button>
      </div>
    );
  }

  render() {
    const { children } = this.props;

    return (
      <section className={s.host}>
        <div className={s.container_body}>
          <div className={s.container_content}>
            {children}
          </div>
        </div>
        <footer className={s.footer}>
          {this.renderButtons()}
        </footer>
      </section>
    );
  }
}
