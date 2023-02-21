import { ConceptFalse, ConceptTrue } from '../constants';
import { OHRIFormField, OHRIFormPage, OHRIFormSection } from '../api/types';
import { CommonExpressionHelpers, registerDependency } from './common-expression-helpers';
import { parseExpression } from './expression-parser';

export interface FormNode {
  value: OHRIFormPage | OHRIFormSection | OHRIFormField;
  type: 'field' | 'page' | 'section';
}

export interface ExpressionContext {
  mode: 'enter' | 'edit' | 'view';
  myValue?: any;
  patient: any;
}

export function evaluateExpression(
  expression: string,
  node: FormNode,
  allFields: Array<OHRIFormField>,
  allFieldValues: Record<string, any>,
  context: ExpressionContext,
): any {
  const allFieldsKeys = allFields.map(f => f.id);
  const parts = parseExpression(expression.trim());
  // setup function scope
  const { mode, myValue, patient } = context;
  const {
    isEmpty,
    today,
    includes,
    isDateBefore,
    isDateAfter,
    addWeeksToDate,
    addDaysToDate,
    useFieldValue,
    calcBMI,
    calcEDD,
    calcMonthsOnART,
    calcViralLoadStatus,
    calcNextVisitDate,
    calcTreatmentEndDate,
    calcAgeBasedOnDate,
  } = new CommonExpressionHelpers(node, patient, allFields, allFieldValues, allFieldsKeys);

  parts.forEach((part, index) => {
    if (index % 2 == 0 && allFieldsKeys.includes(part)) {
      expression = interpolateFieldValue(node, expression, allFields, allFieldValues, part);
    }
  });

  try {
    return eval(expression);
  } catch (error) {
    console.error(error);
  }
  return null;
}

export async function evaluateAsyncExpression(
  expression: string,
  node: FormNode,
  allFields: Array<OHRIFormField>,
  allFieldValues: Record<string, any>,
  context: ExpressionContext,
): Promise<any> {
  const allFieldsKeys = allFields.map(f => f.id);
  const parts = parseExpression(expression.trim());
  // setup function scope
  const { mode, myValue, patient } = context;
  const {
    isEmpty,
    today,
    includes,
    isDateBefore,
    isDateAfter,
    addWeeksToDate,
    addDaysToDate,
    useFieldValue,
    calcBMI,
    calcEDD,
    calcMonthsOnART,
    calcViralLoadStatus,
    calcNextVisitDate,
    calcTreatmentEndDate,
    calcAgeBasedOnDate,
  } = new CommonExpressionHelpers(node, patient, allFields, allFieldValues, allFieldsKeys);

  const lazyFragments = [];
  parts.forEach((part, index) => {
    if (index % 2 == 0) {
      if (allFieldsKeys.includes(part)) {
        expression = interpolateFieldValue(node, expression, allFields, allFieldValues, part);
      }
      if (part.startsWith('resolve(')) {
        lazyFragments.push({ expression: part, index });
      }
    }
  });

  // resolve lazy fragments
  const fragments = await Promise.all(lazyFragments.map(({ expression }) => eval(expression)));
  lazyFragments.forEach((fragment, index) => {
    expression = expression.replace(
      fragment.expression,
      typeof fragments[index] == 'string' ? `'${fragments[index]}'` : fragments[index],
    );
  });

  try {
    return eval(expression);
  } catch (error) {
    console.error(error);
  }
  return null;
}

/**
 * Used as wrapper around async functions. It basically evaluates the promised value.
 */
function resolve(lazy: Promise<any>) {
  return Promise.resolve(lazy);
}

/**
 * Interpolates the field value into the expression; This is done by replacing the field id with the field value.
 * @param fieldNode The field node
 * @param expression The expression
 * @param fields All fields
 * @param fieldValues Field values
 * @param token The field id to be replaced
 * @returns Refined expression
 */
function interpolateFieldValue(
  fieldNode: FormNode,
  expression: string,
  fields: Array<OHRIFormField>,
  fieldValues: Record<string, any>,
  token: string,
): string {
  const determinant = fields.find(field => field.id === token);
  registerDependency(fieldNode, determinant);
  // prep eval variables
  let determinantValue = fieldValues[token];
  if (determinant.questionOptions.rendering == 'toggle' && typeof determinantValue == 'boolean') {
    determinantValue = determinantValue ? ConceptTrue : ConceptFalse;
  }
  if (typeof determinantValue == 'string') {
    determinantValue = `'${determinantValue}'`;
  }
  const regx = new RegExp(token, 'g');
  expression = expression.replace(regx, determinantValue);
  return expression;
}

// For testing purposes only
function mockAsyncFunction(value: any, delay?: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value);
    }, delay || 1000);
  });
}
