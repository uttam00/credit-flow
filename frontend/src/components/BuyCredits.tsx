import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import PaymentIcon from '@mui/icons-material/Payment';
import { getCurrencies } from '../services/currencies';
import { buyCredits } from '../services/payment';
import { buyCreditsSchema, type BuyCreditsFormValues } from '../validation/buyCreditsSchema';
import type { CurrencyInfo } from '../types/currency';

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function BuyCredits() {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BuyCreditsFormValues>({
    resolver: yupResolver(buyCreditsSchema),
    defaultValues: { currencyId: 0, mode: 'plan', planIndex: 0, quantity: 1 },
  });

  useEffect(() => {
    getCurrencies()
      .then((data) => {
        setCurrencies(data);
        if (data.length > 0) {
          setValue('currencyId', data[0].id);
        }
      })
      .catch(() => setLoadError('Failed to load currencies'))
      .finally(() => setLoading(false));
  }, [setValue]);

  const currencyId = watch('currencyId');
  const mode = watch('mode');
  const planIndex = watch('planIndex');
  const quantity = watch('quantity');

  if (loading) {
    return <Skeleton variant="rounded" height={360} />;
  }

  if (loadError || currencies.length === 0) {
    return <Alert severity="error">{loadError ?? 'No currencies available'}</Alert>;
  }

  const currency = currencies.find((entry) => entry.id === currencyId) ?? currencies[0];
  const displayAmountInPaise =
    mode === 'plan'
      ? (currency.plans[planIndex]?.priceInPaise ?? 0)
      : (quantity || 0) * currency.priceInPaise;

  async function onSubmit(values: BuyCreditsFormValues) {
    setSubmitError(null);
    try {
      const url = await buyCredits(
        values.mode === 'plan'
          ? { currencyId: values.currencyId, planIndex: values.planIndex }
          : { currencyId: values.currencyId, quantity: values.quantity },
      );
      window.location.href = url;
    } catch {
      setSubmitError('Could not start checkout. Please try again.');
    }
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Buy Credits
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a currency and how many credits to buy. Payment is handled securely by Stripe.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Controller
            name="currencyId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Currency"
                fullWidth
                margin="normal"
                onChange={(event) => {
                  field.onChange(event);
                  setValue('planIndex', 0);
                }}
              >
                {currencies.map((entry) => (
                  <MenuItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <FormControl sx={{ mt: 2, display: 'block' }}>
            <FormLabel id="credits-mode-label">How many credits?</FormLabel>
            <Controller
              name="mode"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} aria-labelledby="credits-mode-label" row>
                  <FormControlLabel value="plan" control={<Radio />} label="Choose a plan" />
                  <FormControlLabel value="quantity" control={<Radio />} label="Custom quantity" />
                </RadioGroup>
              )}
            />
          </FormControl>

          {mode === 'plan' ? (
            <Controller
              name="planIndex"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Plan" fullWidth margin="normal">
                  {currency.plans.map((plan, index) => (
                    <MenuItem key={plan.credits} value={index}>
                      {plan.credits} credits — {formatRupees(plan.priceInPaise)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          ) : (
            <TextField
              {...register('quantity', { valueAsNumber: true })}
              label="Quantity"
              type="number"
              fullWidth
              margin="normal"
              error={Boolean(errors.quantity)}
              helperText={errors.quantity?.message}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {formatRupees(displayAmountInPaise)}
            </Typography>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<PaymentIcon />}
            disabled={isSubmitting}
          >
            Proceed to Stripe
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default BuyCredits;
