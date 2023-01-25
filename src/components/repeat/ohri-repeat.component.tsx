import { FormGroup, Button } from '@carbon/react';
import { useFormikContext } from 'formik';
import { cloneDeep } from 'lodash';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ConceptTrue } from '../../constants';
import { OHRIFormContext } from '../../ohri-form-context';
import { getHandler } from '../../registry/registry';
import { OHRIFormField, OHRIFormFieldProps } from '../../api/types';
import { OHRIObsGroup } from '../group/ohri-obs-group.component';
import { TrashCan, Add } from '@carbon/react/icons';
import styles from '../inputs/_input.scss';
import { getConcept } from '../../api/api';
import { evaluateExpression } from '../../utils/expression-runner';
import { isEmpty } from '../../validators/ohri-form-validator';

export const getInitialValueFromObs = (field: OHRIFormField, obsGroup: any) => {
  const rendering = field.questionOptions.rendering;
  const obs = obsGroup.groupMembers.filter(o => o.concept.uuid == field.questionOptions.concept);
  if (obs.length) {
    field.value = obs[0];
    if (rendering == 'radio' || rendering == 'content-switcher') {
      getConcept(field.questionOptions.concept, 'custom:(uuid,display,datatype:(uuid,display,name))').subscribe(
        result => {
          if (result.datatype.name == 'Boolean') {
            field.value.value = obs[0].value.uuid;
          }
        },
      );
    }
    if (typeof obs[0].value == 'string' || typeof obs[0].value == 'number') {
      return field.questionOptions.rendering == 'date' ? moment(obs[0].value).toDate() : obs[0].value;
    }
    if (field.questionOptions.rendering == 'checkbox') {
      field.value = obs;
      return field.value.map(o => o.value.uuid);
    }
    if (field.questionOptions.rendering == 'toggle') {
      field.value.value = obs[0].value.uuid;
      return obs[0].value == ConceptTrue;
    }
    return obs[0].value?.uuid;
  }
  return '';
};

export const updateFieldIdInExpression = (expression: string, index: number, questionIds: string[]) => {
  let uniqueQuestionIds = [...new Set(questionIds)];
  uniqueQuestionIds.forEach(id => {
    if (expression.match(id)) {
      expression = expression.replace(new RegExp(id, 'g'), `${id}-${index}`);
    }
  });
  return expression;
};

export const OHRIRepeat: React.FC<OHRIFormFieldProps> = ({ question, onChange }) => {
  const [questions, setQuestions] = useState([question]);
  const { fields, encounterContext, obsGroupsToVoid } = React.useContext(OHRIFormContext);
  const { values, setValues } = useFormikContext();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (encounterContext.encounter && !counter) {
      const alreadyMappedGroup = question.value?.uuid;
      const unMappedObsGroups = encounterContext.encounter.obs.filter(
        obs => obs.concept.uuid === question.questionOptions.concept && obs.uuid != alreadyMappedGroup,
      );
      // create new fields and map them values
      let tempCounter = counter;
      unMappedObsGroups.forEach(obsGroup => {
        tempCounter = tempCounter + 1;
        handleAdd(tempCounter, obsGroup);
      });
      setCounter(tempCounter);
    }
  }, [values]);

  useEffect(() => {
    questions[0] = question;
    setQuestions([...questions]);
  }, [question]);

  const handleAdd = (count: number, obsGroup?: any) => {
    const questionIds: string[] = [];
    const idSuffix = count;
    const next = cloneDeep(question);
    next.value = obsGroup;
    next.id = `${next.id}-${idSuffix}`;
    next.questions.forEach(q => {
      questionIds.push(q.id);
    });
    next.questions.forEach(q => {
      q.id = `${q.id}-${idSuffix}`;
      q['groupId'] = next.id;
      q.value = null;
      let initialValue = obsGroup ? getInitialValueFromObs(q, obsGroup) : null;
      values[`${q.id}`] = initialValue ? initialValue : q.questionOptions.rendering == 'checkbox' ? [] : '';

      //Evaluate hide expressions
      if (q['hide'].hideWhenExpression) {
        let updatedExpression = updateFieldIdInExpression(q['hide'].hideWhenExpression, idSuffix, questionIds);
        q['hide'].hideWhenExpression = updatedExpression;
        q.isHidden = evaluateExpression(updatedExpression, { value: q, type: 'field' }, fields, values, {
          mode: encounterContext.sessionMode,
          patient: encounterContext.patient,
        });
      }

      //Evaluate validators
      if (q.validators) {
        if (q.validators.length > 0) {
          for (let value of q.validators) {
            if (value.type === 'js_expression') {
              value['failsWhenExpression'] = updateFieldIdInExpression(
                value['failsWhenExpression'],
                idSuffix,
                questionIds,
              );
            }
          }
        }
      }

      //Evaluate Calculated Expressions
      if (q.questionOptions.calculate?.calculateExpression) {
        const updatedExpression = updateFieldIdInExpression(
          q.questionOptions.calculate?.calculateExpression,
          idSuffix,
          questionIds,
        );
        const result = evaluateExpression(updatedExpression, { value: q, type: 'field' }, fields, values, {
          mode: encounterContext.sessionMode,
          patient: encounterContext.patient,
        });
        if (!isEmpty(result)) {
          values[q.id] = result;
          getHandler(q.type).handleFieldSubmission(q, result, encounterContext);
        }
      }

      fields.push(q);
    });
    setValues(values);
    fields.push(next);
    questions.push(next);
    setQuestions(questions);
  };

  const removeNthRow = (question: OHRIFormField) => {
    if (question.value && question.value.uuid) {
      // obs group should be voided
      question.value['voided'] = true;
      delete question.value.value;
      obsGroupsToVoid.push(question.value);
    }
    setQuestions(questions.filter(q => q.id !== question.id));
    // cleanup
    const dueFields = [question.id, ...question.questions.map(q => q.id)];
    dueFields.forEach(field => {
      const index = fields.findIndex(f => f.id === field);
      fields.splice(index, 1);
      delete values[field];
    });
  };
  const nodes = questions.map((question, index) => {
    const deleteControl =
      questions.length > 1 ? (
        <div>
          <div style={{ paddingTop: '1.2rem', marginLeft: '.5rem' }} className={styles.flexColumn}>
            <Button
              renderIcon={() => <TrashCan size={16} />}
              kind="danger--tertiary"
              onClick={() => removeNthRow(question)}
              hasIconOnly
            />
          </div>
        </div>
      ) : null;
    return (
      <>
        {index != 0 && (
          <div>
            <hr style={{ borderTop: '1px solid #bbb', marginBottom: '2rem', width: '85%', float: 'left' }} />
          </div>
        )}
        <div style={{ margin: '1rem 0rem' }}>
          <OHRIObsGroup
            question={question}
            onChange={onChange}
            handler={getHandler('obsGroup')}
            deleteControl={deleteControl}
            sessionMode={encounterContext.sessionMode}
          />
        </div>
      </>
    );
  });

  nodes.push(
    <div>
      {encounterContext.sessionMode != 'view' && (
        <Button
          renderIcon={() => <Add size={16} />}
          kind="ghost"
          onClick={() => {
            const nextCount = counter + 1;
            handleAdd(nextCount, null);
            setCounter(nextCount);
          }}>
          {question.questionOptions.repeatOptions?.addText || 'Add'}
        </Button>
      )}
    </div>,
  );
  return (
    !question.isHidden && (
      <div style={{ marginTop: '0.65rem', marginBottom: '2rem' }}>
        <FormGroup legendText={question.label} className={styles.boldLegend}>
          {nodes}
        </FormGroup>
      </div>
    )
  );
};
