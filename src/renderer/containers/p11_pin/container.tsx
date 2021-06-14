/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable import/extensions */
import * as React from 'react';
import { ModalLayout } from '../../components/layouts';
import { WindowEvent } from '../../components/window_event';
import './styles/container.css';
import { IntlContext } from '../../components/intl/intl_context';
import { ISignatureWindowParams } from '../../../main/windows';
import logger from '../../../main/logger';

export interface IContainerProps {
  onClose: () => void;
  params: ISignatureWindowParams;
}

const Container = (props: IContainerProps) => {
  const textFieldRef = React.createRef<any>();
  const { intl } = React.useContext(IntlContext);
  const request = props?.params.request.signatureRequest;
  const certificate = props?.params.request.certificate;
  const [pin, setPin] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);

  const onApprove = () => {
    setInProgress(true);
    props.params.onSign(pin).then(() => {
      logger.info('SignatureWindow', 'Signed', request);
      props.onClose();
    }).catch((err) => {
      logger.error('SignatureWindow', err.message, err);
    }).finally(() => {
      setInProgress(false);
    });
  };

  const onClose = () => {
    if (props.params.onCancel) props.params.onCancel();
    props.onClose();
  };

  const onPinKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.which === 8) {
      if (pin.length > 0) {
        setPin(pin.substr(0, pin.length - 1));
      }
    }
    if (pin.length < 6 && e.which > 47 && e.which < 58) {
      setPin(pin + e.key);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.keyCode) {
      case 13: // enter
        onApprove();
        break;

      case 27: // esc
        onClose();
        break;

      default:
    }
  };

  const getSignFormat = (format: number, kind: number) => {
    const formats = ['CAdES', 'XAdES', 'XAdES'];
    const kinds = ['BES', 'T', 'XL', 'A'];

    return `${formats[format - 1]}-${kinds[kind - 1]}`;
  };

  const getSignDesc = (format: number, kind: number) => {
    const kindDesc = ['Basit', 'Zaman damgalı', 'Uzun dönemli', 'Arşiv'];
    const formatDesc = ['elektronik', 'XML', 'PDF'];

    return [`${kindDesc[kind - 1]} ${formatDesc[format - 1]} imza`];
  };

  const onPinClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ): void => {
    if (pin.length < 6) {
      setPin(pin + e.currentTarget.innerText);
      textFieldRef.current?.focus();
    }
  };

  return (
    <>
      <WindowEvent
        event="keydown"
        onCall={onKeyDown}
      />
      <ModalLayout
        title={[
          [<a href={origin}>{origin}</a>, <br />, intl('p11-pin.1')],
          intl('p11-pin.2'),
        ]}
        onApprove={onApprove}
        onCancel={onClose}
        textReject={intl('cancel')}
        textApprove={intl('sign')}
        inProgress={inProgress}
        isValid={pin.length >= 4}
      >
        <div className="container_content sign-panel">
          <div className="request-panel">
            <div className="card">
              <small>Talep Eden</small>
              <p className="">{request.requestedBy}</p>
            </div>
            <div className="card">
              <small>Konu</small>
              <p className="">{request.subject}</p>
            </div>
            <div className="card">
              <small>Referans Numarası</small>
              <p className="">{request.requestRef}</p>
            </div>
            <div className="card">
              <small>Dosyalar</small>
              <ul className="files">
                <li>
                  <div className="file-info">
                    <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" x="0" y="0" enableBackground="new 0 0 16 16" version="1.1" viewBox="0 0 16 16" xmlSpace="preserve">
                      <path id="path7" stroke="none" fill="rgb(var(--black))" d="M 3.7519531,0.011719 C 2.7849531,0.011719 2,0.79862525 2,1.7656252 L 2,12.28125 c 0,0.967 0.7849531,1.751953 1.7519531,1.751953 l 4.5175781,0 c 0.007,0 0.011531,-0.0068 0.019531,-0.0078 0.5,1.153 1.6464691,1.962891 2.9804695,1.96289 1.792,0 3.25,-1.458 3.25,-3.25 0,-1.355999 -0.836532,-2.516906 -2.019532,-3.0039058 l 0,-5.4511718 c 0,-0.008 -0.0088,-0.014437 -0.0098,-0.023437 -10e-4,-0.065 -0.0155,-0.1287813 -0.0625,-0.1757813 L 8.4277344,0.08398462 c -0.052,-0.051 -0.1233594,-0.06454687 -0.1933594,-0.06054687 -0.01,-0.001 -0.017344,-0.01171875 -0.027344,-0.01171875 l -4.4550781,0 z m 0,0.5 4.2480469,0 0,2.2617188 c 0,0.959 0.7802812,1.7382812 1.7382812,1.7382812 l 2.2617188,0 0,5.0664062 c -0.236,-0.055 -0.478468,-0.089844 -0.730468,-0.089844 -1.7920008,0 -3.2500008,1.4580005 -3.2500008,3.2499995 0,0.276 0.044375,0.538922 0.109375,0.794922 l -4.3769531,0 C 3.0619531,13.533203 2.5,12.969297 2.5,12.279297 l 0,-10.5136718 c 0,-0.691 0.5619531,-1.2539062 1.2519531,-1.2539062 z M 8.5,0.90429712 C 9.264,1.6632971 10.788,3.178719 11.625,4.011719 l -1.8867188,0 C 9.0552812,4.011719 8.5,3.4564377 8.5,2.7734378 l 0,-1.86914068 z m 2.769532,9.08398438 c 1.517,0 2.75,1.2330005 2.75,2.7499995 0,1.517 -1.233,2.75 -2.75,2.75 -1.5170008,0 -2.7500008,-1.233 -2.7500008,-2.75 0,-1.516999 1.233,-2.7499995 2.7500008,-2.7499995 z m -0.25,1.4160155 0,1.966797 L 10.236328,12.634766 9.8945316,13 l 1.3730464,1.289063 1.339844,-1.291016 -0.347656,-0.359375 -0.740234,0.714844 0,-1.949219 -0.5,0 z" />
                    </svg>
                    <p>{request.fileName}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="card"><small>İmza Formatı / Türü</small>
              <div className="mb-3"><b>{getSignFormat(request.format, request.kind)}</b>&nbsp;&nbsp;<span>{getSignDesc(request.format, request.kind)}</span></div>
            </div>
            <div className="card">
              <small>Sertifika</small>
              <p>{certificate?.subject}</p>
              <p>{certificate?.notBefore.toLocaleDateString('TR-tr')} - {certificate?.notAfter.toLocaleDateString('TR-tr')}</p>
              <p className="issuer">{certificate?.issuer}</p>
            </div>
          </div>
          <div className="signature-panel">
            <div className="keypad">
              <div>
                <button type="button" onClick={(e) => onPinClick(e)}>1</button>
                <button type="button" onClick={(e) => onPinClick(e)}>2</button>
                <button type="button" onClick={(e) => onPinClick(e)}>3</button>
              </div>
              <div>
                <button type="button" onClick={(e) => onPinClick(e)}>4</button>
                <button type="button" onClick={(e) => onPinClick(e)}>5</button>
                <button type="button" onClick={(e) => onPinClick(e)}>6</button>
              </div>
              <div>
                <button type="button" onClick={(e) => onPinClick(e)}>7</button>
                <button type="button" onClick={(e) => onPinClick(e)}>8</button>
                <button type="button" onClick={(e) => onPinClick(e)}>9</button>
              </div>
              <div>
                <button type="button" onClick={(e) => onPinClick(e)}>0</button>
              </div>
            </div>
            <div>
              <label data-component="text_field" data-disabled="false" className="text_field field">
                <div data-component="input" data-type="stroke" data-disabled="false" className="input">
                  <input
                    className="input_field round_small input_field_large stroke_grey_2 input_field_focus_primary fill_white text_black input_placeholder_color_grey_4 text_field_type_password"
                    ref={textFieldRef}
                    onKeyDown={(e) => onPinKeyPress(e)}
                    type="password"
                    placeholder="PIN"
                    aria-describedby="pin"
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    value={pin}
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                    onChange={() => { }}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </ModalLayout>
    </>
  );
};

export default Container;
