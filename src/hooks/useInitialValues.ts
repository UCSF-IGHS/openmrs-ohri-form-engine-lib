import { useEffect, useState } from 'react';
import { inferInitialValueFromDefaultFieldValue, isEmpty } from '..';
import { OHRIFormField, OpenmrsEncounter } from '../api/types';
import { getHandler } from '../registry/registry';
import { evaluateAsyncExpression } from '../utils/expression-runner';

export function useInitialValues(formFields: OHRIFormField[], encounter: OpenmrsEncounter, encounterContext) {
  const [asyncInitValues, setAsyncInitValues] = useState<Record<string, Promise<any>>>({});
  const [isFieldEncounterBindingComplete, setIsFieldEncounterBindingComplete] = useState(false);
  const [initialValues, setInitialValues] = useState([]);
  const tempInitVals = {};

  useEffect(() => {
    const asyncItemsKeys = Object.keys(asyncInitValues);
    Promise.all(asyncItemsKeys.map(key => asyncInitValues[key])).then(results => {
      asyncItemsKeys.forEach((key, index) => {
        if (!isEmpty(results[index])) {
          initialValues[key] = results[index];

          // TODO: fix below
          // getHandler(field.type).handleFieldSubmission(field, result, encounterContext);
        }
      });
      setInitialValues({ ...initialValues });
    });
  }, [asyncInitValues]);

  useEffect(() => {
    if (encounter) {
      formFields.forEach(field => {
        const handler = getHandler(field.type);
        let existingVal = handler?.getInitialValue(encounter, field, formFields);
        if (isEmpty(existingVal) && !isEmpty(field.questionOptions.defaultValue)) {
          existingVal = inferInitialValueFromDefaultFieldValue(field, encounterContext, handler);
        }
        tempInitVals[field.id] = existingVal === null || existingVal === undefined ? '' : existingVal;
        if (field.unspecified) {
          tempInitVals[`${field.id}-unspecified`] = !!!existingVal;
        }
      });
      setIsFieldEncounterBindingComplete(true);
    } else {
      const emptyValues = {
        checkbox: [],
        toggle: false,
        default: '',
      };
      formFields.forEach(field => {
        let value = null;
        if (field.questionOptions.calculate && !asyncInitValues[field.id]) {
          asyncInitValues[field.id] = evaluateAsyncExpression(
            field.questionOptions.calculate.calculateExpression,
            { value: field, type: 'field' },
            formFields,
            tempInitVals,
            {
              mode: encounterContext.sessionMode,
              patient: encounterContext.patient,
            },
          );
        }
        if (!isEmpty(field.questionOptions.defaultValue)) {
          value = inferInitialValueFromDefaultFieldValue(field, encounterContext, getHandler(field.type));
        }
        if (!isEmpty(value)) {
          tempInitVals[field.id] = value;
        } else {
          tempInitVals[field.id] =
            emptyValues[field.questionOptions.rendering] != undefined
              ? emptyValues[field.questionOptions.rendering]
              : emptyValues.default;
        }
        if (field.unspecified) {
          tempInitVals[`${field.id}-unspecified`] = false;
        }
      });
      setAsyncInitValues({ ...asyncInitValues });
    }
  }, [encounter]);

  return {
    initialValues,
    isFieldEncounterBindingComplete,
  };
}
