import { Checkbox } from '@carbon/react';
import { useField } from 'formik';
import React, { useCallback, useEffect, useState } from 'react';
import { OHRIFormContext } from '../../../ohri-form-context';
import styles from '../_input.scss';
import { OHRIFieldValidator } from '../../../validators/ohri-form-validator';
import { OHRIFormField, SessionMode } from '../../../api/types';
import { isTrue } from '../../../utils/boolean-utils';

export const OHRIUnspecified: React.FC<{
  question: OHRIFormField;
  sessionMode?: SessionMode;
}> = ({ question, sessionMode }) => {
  const [field, meta] = useField(`${question.id}-unspecified`);
  const { setFieldValue } = React.useContext(OHRIFormContext);
  const [previouslyUnspecified, setPreviouslyUnspecified] = useState(false);
  const [hideCheckBox, setHideCheckBox] = useState(false);

  useEffect(() => {
    if (field.value) {
      setPreviouslyUnspecified(true);
      question['submission'] = {
        unspecified: true,
        errors: [],
      };
      let emptyValue = null;
      switch (question.questionOptions.rendering) {
        case 'date':
          emptyValue = '';
          break;
        case 'checkbox':
          emptyValue = [];
      }
      setFieldValue(question.id, emptyValue);
      question.value = null;
    } else if (previouslyUnspecified && !question.value) {
      question['submission'] = {
        unspecified: false,
        errors: OHRIFieldValidator.validate(question, null),
      };
    }
  }, [field.value]);

  useEffect(() => {
    if (question.value) {
      setFieldValue(`${question.id}-unspecified`, false);
      if (sessionMode == 'view') {
        setHideCheckBox(true);
      }
    }
  }, [question.value]);

  const handleOnChange = useCallback(value => {
    setFieldValue(`${question.id}-unspecified`, value);
  }, []);

  return (
    !question.isHidden &&
    !isTrue(question.readonly) &&
    !hideCheckBox && (
      <div className={styles.unspecified}>
        <Checkbox
          id={`${question.id}-unspcified`}
          labelText="Unspecified"
          value="Unspecified"
          onChange={handleOnChange}
          checked={field.value}
          disabled={question.disabled}
        />
      </div>
    )
  );
};
