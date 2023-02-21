import { FieldValidator, OHRIFormField } from '../api/types';
import { evaluateExpression, ExpressionContext } from '../utils/expression-runner';

interface JSExpressionValidatorConfig {
  failsWhenExpression?: string;
  warnsWhenExpression?: string;
  message: string;
  fields: OHRIFormField[];
  expressionContext: ExpressionContext;
  values: Record<string, any>;
}

export const OHRIJSExpressionValidator: FieldValidator = {
  validate: function(field: OHRIFormField, value: any, config: JSExpressionValidatorConfig) {
    config.expressionContext.myValue = value;

    Object.keys(config).map(key => {
      if (key == 'failsWhenExpression' || key == 'warnsWhenExpression') {
        const resultType = key == 'warnsWhenExpression' ? 'warning' : 'error';

        return evaluateExpression(
          config[key],
          { value: field, type: 'field' },
          config.fields,
          { ...config.values, [field.id]: value },
          config.expressionContext,
        )
          ? [{ resultType, errCode: 'value.invalid', message: config.message || 'Invalid value' }]
          : [];
      }
    });

    return [];
  },
};
