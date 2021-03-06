import { Button } from 'carbon-components-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { OHRIValueDisplay } from '../value/ohri-value.component';
import inputControlStyles from '../inputs/_input.scss';

export const PreviousValueReview: React.FC<{
  value: any;
  displayText: string;
  setValue: (value: any) => void;
  hideHeader?: boolean;
}> = ({ value, displayText, setValue, hideHeader }) => {
  const { t } = useTranslation();
  return (
    <div className={inputControlStyles.formField} style={{ width: '14rem', marginLeft: '2rem' }}>
      {!hideHeader && (
        <div>
          <span className="bx--label">{t('previously', 'Previously')}</span>
        </div>
      )}
      <div className={inputControlStyles.row}>
        <div style={{ width: '100%' }}>
          <OHRIValueDisplay value={displayText} />
        </div>
        <div style={{ width: '100%' }}>
          <Button
            kind="ghost"
            style={{ verticalAlign: 'baseline' }}
            onClick={e => {
              e.preventDefault();
              setValue(value);
            }}>
            {t('useValue', 'Use value')}
          </Button>
        </div>
      </div>
    </div>
  );
};
