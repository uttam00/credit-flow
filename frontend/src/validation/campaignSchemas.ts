import * as yup from 'yup';

export const createCampaignSchema = yup.object({
  name: yup.string().trim().required('Campaign name is required'),
});

export type CreateCampaignFormValues = yup.InferType<typeof createCampaignSchema>;

export const fundCampaignSchema = yup.object({
  amountInCredits: yup
    .number()
    .typeError('Enter a number')
    .integer('Must be a whole number')
    .positive('Must be greater than zero')
    .required('Amount is required'),
});

export type FundCampaignFormValues = yup.InferType<typeof fundCampaignSchema>;
