import { fireEvent, render, screen } from '@testing-library/react';
import { Formik, Form } from 'formik';
import React from 'react';
import { OHRIFormField, EncounterContext, OHRIFormContext } from '../../..';
import { ObsSubmissionHandler } from '../../../submission-handlers/base-handlers';
import OHRIDropdown from '../select/ohri-dropdown.component';
import { OHRIUnspecified } from './ohri-unspecified.component';

const question: OHRIFormField = {
  label: 'Visit Date',
  type: 'obs',
  questionOptions: {
    rendering: 'date',
    concept: '163260AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  id: 'visit-date',
};

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

const renderForm = intialValues => {
  render(
    <Formik initialValues={intialValues} onSubmit={null}>
      {props => (
        <Form>
          <OHRIFormContext.Provider
            value={{
              values: props.values,
              setFieldValue: props.setFieldValue,
              setEncounterLocation: jest.fn(),
              obsGroupsToVoid: [],
              setObsGroupsToVoid: jest.fn(),
              encounterContext: encounterContext,
              fields: [question],
              isFieldInitializationComplete: true,
              isSubmitting: false,
            }}>
            <OHRIUnspecified question={question} />
          </OHRIFormContext.Provider>
        </Form>
      )}
    </Formik>,
  );
};

describe('Unspecified field', () => {
  it('should check whether checkbox is checked or not', async () => {
    await renderForm({});

    //setup
    const unspecifiedCheckbox = screen.getByRole('checkbox', { name: /Unspecified/ });
    //assert
    expect(unspecifiedCheckbox).not.toBeChecked();

    fireEvent.click(unspecifiedCheckbox);
    expect(unspecifiedCheckbox).toBeChecked();
  });
});
