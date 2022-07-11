import { render, fireEvent, screen, prettyDOM, cleanup, act } from '@testing-library/react';
import React from 'react';
import OHRIForm from './ohri-form.component';
import hts_poc_1_1 from '../__mocks__/packages/hiv/forms/hts_poc/1.1.json';
import bmi_form from '../__mocks__/packages/other-forms/bmi-test-form.json';
import edd_form from '../__mocks__/packages/other-forms/edd-test-form.json';
import next_visit_form from '../__mocks__/packages/other-forms/next-visit-test-form.json';
import { mockPatient } from '../__mocks__/patient.mock';
const patientUUID = '8673ee4f-e2ab-4077-ba55-4980f408773e';

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    createErrorHandler: jest.fn(),
    showNotification: jest.fn(),
    showToast: jest.fn(),
    getAsyncLifecycle: jest.fn(),
    usePatient: jest.fn().mockImplementation(() => ({ patient: mockPatient })),
  };
});

jest.mock('../src/api/api', () => {
  const originalModule = jest.requireActual('../src/api/api');

  return {
    ...originalModule,
    getPreviousEncounter: jest.fn().mockImplementation(() => Promise.resolve(null)),
    fetchConceptNameByUuid: jest.fn().mockImplementation(() => Promise.resolve(null)),
    getConcept: jest.fn().mockImplementation(() => Promise.resolve(null)),
  };
});

describe('OHRI Forms: ', () => {
  afterEach(() => {
    cleanup();
  });

  it('Should render without dying', async () => {
    await renderForm(hts_poc_1_1);
  });

  it('Should render all form fields', () => {
    // TODO: Add test logic
  });

  describe('Form submission', () => {
    // TODO: Fillup test suite
  });

  describe('Calcuated values', () => {
    afterEach(() => {
      cleanup();
    });

    it('Should evaluate BMI', async () => {
      // setup
      await renderForm(bmi_form);
      let bmiField = screen.getByRole('textbox', { name: /BMI/ }) as HTMLInputElement;
      let heightField = screen.getByRole('spinbutton', { name: /Height/ }) as HTMLInputElement;
      let weightField = screen.getByRole('spinbutton', { name: /Weight/ }) as HTMLInputElement;

      expect(heightField.value).toBe('');
      expect(weightField.value).toBe('');
      expect(bmiField.value).toBe('');

      // replay
      fireEvent.blur(heightField, { target: { value: 150 } });
      fireEvent.blur(weightField, { target: { value: 50 } });

      // verify
      expect(heightField.value).toBe('150');
      expect(weightField.value).toBe('50');
      expect(bmiField.value).toBe('22.2');
    });

    it('Should evaluate EDD', async () => {
      // setup
      await renderForm(edd_form);
      let eddField = screen.getByRole('textbox', { name: /EDD/ }) as HTMLInputElement;
      let lmpField = screen.getByRole('textbox', { name: /LMP/ }) as HTMLInputElement;

      expect(eddField.value).toBe('');
      expect(lmpField.value).toBe('');

      // replay
      fireEvent.blur(lmpField, { target: { value: '2022-07-06T00:00:00.000Z' } });

      // verify
      expect(lmpField.value).toBe('7/6/2022');
      expect(eddField.value).toBe('4/12/2023');
    });

    it('Should evaluate next visit date', async () => {
      // setup
      await renderForm(next_visit_form);
      let followupDateField = screen.getByRole('textbox', { name: /Followup Date/ }) as HTMLInputElement;
      let arvDispensedInDaysField = screen.getByRole('spinbutton', {
        name: /ARV dispensed in days/,
      }) as HTMLInputElement;
      let nextVisitDateField = screen.getByRole('textbox', { name: /Next visit date/ }) as HTMLInputElement;

      expect(followupDateField.value).toBe('');
      expect(arvDispensedInDaysField.value).toBe('');
      expect(nextVisitDateField.value).toBe('');

      // replay
      fireEvent.blur(followupDateField, { target: { value: '2022-07-06T00:00:00.000Z' } });
      fireEvent.blur(arvDispensedInDaysField, { target: { value: 120 } });

      // verify
      expect(followupDateField.value).toBe('7/6/2022');
      expect(arvDispensedInDaysField.value).toBe('120');
      expect(nextVisitDateField.value).toBe('11/3/2022');
    });
  });

  async function renderForm(formJson) {
    await act(async () => render(<OHRIForm formJson={formJson as any} patientUUID={patientUUID} />));
  }
});
