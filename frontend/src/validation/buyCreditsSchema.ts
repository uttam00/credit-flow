import * as yup from 'yup';

export const buyCreditsSchema = yup.object({
  currencyId: yup.number().required(),
  mode: yup.mixed<'plan' | 'quantity'>().oneOf(['plan', 'quantity']).required(),
  planIndex: yup.number().required(),
  // Always required and validated, even though it's only shown (and only
  // read by the submit handler) when mode === 'quantity' — the field stays
  // at its valid default of 1 the rest of the time, which keeps the
  // inferred form type simple instead of conditionally optional.
  quantity: yup
    .number()
    .typeError('Enter a number')
    .integer('Must be a whole number')
    .positive('Must be greater than zero')
    .required('Quantity is required'),
});

export type BuyCreditsFormValues = yup.InferType<typeof buyCreditsSchema>;
