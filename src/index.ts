export * from './api/types';
export * from './utils/forms-loader';
export * from './registry/registry';
export * from './constants';
export * from './utils/boolean-utils';
export * from './validators/ohri-form-validator';
export * from './utils/ohri-form-helper';
export * from './ohri-form-context';
export * from './components/value/view/ohri-field-value-view.component';
export * from './components/previous-value-review/previous-value-review.component';
export { default as OHRIForm } from './ohri-form.component';

import { defineConfigSchema, getAsyncLifecycle } from '@openmrs/esm-framework';

declare var __VERSION__: string;
// __VERSION__ is replaced by Webpack with the version from package.json
const version = __VERSION__;

const backendDependencies = {
  'webservices.rest': '^2.2.0',
  fhir2: '^1.2.0',
};

function setupOpenMRS() {
  const moduleName = '@ohri/esm-form-engine-app';

  const options = {
    featureName: 'ohri-form-engine',
    moduleName,
  };

  defineConfigSchema(moduleName, {});

  return {
    extensions: [
      {
        name: 'ohri-form-engine',
        slot: 'ohri-form-engine-slot',
        load: getAsyncLifecycle(() => import('./ohri-form.component'), options),
      },
    ],
  };
}

export { backendDependencies, setupOpenMRS, version };
