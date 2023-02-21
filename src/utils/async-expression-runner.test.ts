import React from 'react';
import { render, fireEvent, screen, cleanup, act } from '@testing-library/react';
import { Form, Formik } from 'formik';
import { EncounterContext, OHRIFormContext } from '../ohri-form-context';
import { OHRIFormField } from '../api/types';
import { ObsSubmissionHandler } from '../submission-handlers/base-handlers';
import OHRIText from '../components/inputs/text/ohri-text.component';
import { ExpressionContext, evaluateAsyncExpression } from './expression-runner';

const questionFields: Array<OHRIFormField> = [
  {
    label: 'pTracker Ids.',
    type: 'obs',
    questionOptions: {
      rendering: 'text',
      concept: '6c45421e-2566-47cb-bbb3-07586fffbfe2',
    },
    value: null,
    id: 'ptrackerIds',
  },
];

const encounterContext: EncounterContext = {
  patient: {
    id: '833db896-c1f0-11eb-8529-0242ac130003',
  },
  location: {
    uuid: '41e6e516-c1f0-11eb-8529-0242ac130003',
  },
  encounter: {
    uuid: '873455da-3ec4-453c-b565-7c1fe35426be',
    obs: [],
  },
  sessionMode: 'enter',
  date: new Date(2020, 11, 29),
};

const warnField: OHRIFormField = {
  label: 'HTS Date',
  type: 'obs',
  questionOptions: {
    rendering: 'date',
    concept: 'j8b6705b-b6d8-4eju-8f37-0b14f5347569',
    calculate: {
      calculateExpression: 'myValue > new Date()',
    },
  },
  required: true,
  id: 'hts-date',
};

// mock promise
const mockPromise = Promise.resolve({ value: 'test' });

describe('async expression runner test', () => {
  const context: ExpressionContext = { mode: 'enter', patient: {} };
  const questions = JSON.parse(JSON.stringify(questionFields));
  let initialValues = {
    ptrackerIds: null,
  };

  afterEach(() => {
    initialValues = {
      ptrackerIds: null,
    };
    questionFields.forEach(question => (question.fieldDependants = undefined));
  });

  it('fetch values from async function', async () => {
    // play
    const result = await evaluateAsyncExpression(
      'resolveAsync(getAsyncValue()) != null',
      { value: questionFields[0], type: 'field' },
      questionFields,
      initialValues,
      context,
    );
    expect(result).toBe(true);
  });

  // todo: fix this test
  // it('should warn when warnsWhenExpression is valid', () => {
  //   // setup and replay
  //   const errors = OHRIDateValidator.validate(warnField, new Date('December 17, 2032 03:24:00'), {
  //     warnsWhenExpression: 'myValue > new Date()',
  //     expressionContext: { mode: 'enter' },
  //     message: 'Future dates not allowed',
  //   });
  //   // verify
  //   expect(errors).toEqual([{ resultType: 'warning', errCode: 'value.invalid', message: 'Future dates not allowed' }]);
  // });
});

function getAsyncValue() {
  setTimeout(() => {
    console.log('INSIDE ASYNC FUNCTION');
    return Promise.resolve('Some value');
  }, 100);
}
