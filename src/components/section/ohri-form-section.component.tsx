import React, { useCallback, useEffect, useState } from 'react';
import styles from './ohri-form-section.scss';
import { getFieldComponent, getHandler } from '../../registry/registry';
import { OHRIUnspecified } from '../inputs/unspecified/ohri-unspecified.component';
import { OHRIFormField, OHRIFormFieldProps } from '../../api/types';
import { isTrue } from '../../utils/boolean-utils';
import { useField } from 'formik';

export const getFieldControl = (question: OHRIFormField) => {
  // Check if a concept wasn't provided
  if (
    question.type == 'obs' &&
    !question.questionOptions.concept &&
    question.questionOptions.rendering !== 'fixed-value'
  ) {
    // Disable the control
    question.disabled = true;
    // Since we don't have a concept, just render a text input
    return getFieldComponent('text');
  }
  return getFieldComponent(question.questionOptions.rendering);
};

export const supportsUnspecified = question => {
  return (
    isTrue(question.unspecified) &&
    question.questionOptions.rendering != 'toggle' &&
    question.questionOptions.rendering != 'encounter-location'
  );
};
const OHRIFormSection = ({ fields, onFieldChange }) => {
  const [fieldToControlMap, setFieldToControlMap] = useState([]);

  useEffect(() => {
    Promise.all(
      fields.map(field => {
        return getFieldControl(field)?.then(result => ({ field, control: result.default }));
      }),
    ).then(results => {
      setFieldToControlMap(results);
    });
  }, [fields]);

  return (
    <div className={styles.sectionContainer}>
      {fieldToControlMap
        .filter(entry => !!entry)
        .map((entry, index) => {
          const { control, field } = entry;
          if (control) {
            const qnFragment = React.createElement<OHRIFormFieldProps>(control, {
              question: field,
              onChange: onFieldChange,
              key: index,
              handler: getHandler(field.type),
              useField,
            });
            return supportsUnspecified(field) && field.questionOptions.rendering != 'group' ? (
              <div key={index}>
                {qnFragment}
                <OHRIUnspecified question={field} />
              </div>
            ) : (
              <div key={index}>{qnFragment}</div>
            );
          }
        })}
    </div>
  );
};

export default OHRIFormSection;
