import { useEffect, useMemo } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from '@mui/material';

export type Address = {
  company?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string; // e.g. "DE"
};

export type AddressErrors = Partial<Record<keyof Address, string>>;

export function defaultAddress(country: string = 'DE'): Address {
  return {
    company: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country,
  };
}

export function validateAddress(a: Address): AddressErrors {
  const errs: AddressErrors = {};
  if (!a.line1.trim()) errs.line1 = 'Pflichtfeld';
  if (!a.postalCode.trim()) errs.postalCode = 'Pflichtfeld';
  if (!a.city.trim()) errs.city = 'Pflichtfeld';
  if (!a.country.trim()) errs.country = 'Pflichtfeld';

  if (
    a.country === 'DE' &&
    a.postalCode &&
    !/^\d{5}$/.test(a.postalCode.trim())
  ) {
    errs.postalCode = 'Bitte 5-stellige PLZ eingeben';
  }
  return errs;
}

type Props = {
  submitted: boolean;

  billingAddress: Address;
  onBillingAddressChange: (next: Address) => void;

  shippingSameAsBilling: boolean;
  onShippingSameAsBillingChange: (next: boolean) => void;

  shippingAddress: Address;
  onShippingAddressChange: (next: Address) => void;

  // Optional: Parent kann Errors schon berechnen und reinreichen
  billingErrors?: AddressErrors;
  shippingErrors?: AddressErrors;

  // Optional: Texte
  title?: string;
  subtitle?: string;
  billingTitle?: string;
  shippingTitle?: string;

  // Optional: Default country label
  countryLabel?: string;
};

export default function AddressInput({
  submitted,
  billingAddress,
  onBillingAddressChange,
  shippingSameAsBilling,
  onShippingSameAsBillingChange,
  shippingAddress,
  onShippingAddressChange,
  billingErrors,
  shippingErrors,
  title = 'Adresse',
  subtitle,
  billingTitle = 'Rechnungsadresse',
  shippingTitle = 'Lieferadresse',
  countryLabel = 'Land',
}: Props) {
  const computedBillingErrors = useMemo(
    () => billingErrors ?? (submitted ? validateAddress(billingAddress) : {}),
    [billingErrors, submitted, billingAddress],
  );

  const computedShippingErrors = useMemo(
    () =>
      shippingErrors ??
      (submitted && !shippingSameAsBilling
        ? validateAddress(shippingAddress)
        : {}),
    [shippingErrors, submitted, shippingSameAsBilling, shippingAddress],
  );

  // UX: Wenn "gleich" aktiv -> shipping automatisch mitziehen
  useEffect(() => {
    if (shippingSameAsBilling) onShippingAddressChange(billingAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingSameAsBilling, billingAddress]);

  const onToggleSame = (checked: boolean) => {
    onShippingSameAsBillingChange(checked);
    if (!checked) {
      // UX: wenn man abwählt, vorfüllen -> weniger Tipparbeit
      onShippingAddressChange(billingAddress);
    }
  };

  const setBilling = (patch: Partial<Address>) =>
    onBillingAddressChange({ ...billingAddress, ...patch });
  const setShipping = (patch: Partial<Address>) =>
    onShippingAddressChange({ ...shippingAddress, ...patch });

  return (
    <Box mt={4}>
      <Divider className="my-6" />
      <Typography variant="h5" mt={3}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" gutterBottom>
          {subtitle}
        </Typography>
      )}

      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700 }}>
        {billingTitle}
      </Typography>

      <TextField
        fullWidth
        label="Firma (optional)"
        value={billingAddress.company || ''}
        onChange={(e) => setBilling({ company: e.target.value })}
        margin="normal"
        autoComplete="organization"
      />

      <TextField
        fullWidth
        required
        label="Straße & Hausnummer"
        value={billingAddress.line1}
        onChange={(e) => setBilling({ line1: e.target.value })}
        margin="normal"
        autoComplete="billing street-address"
        error={Boolean(submitted && computedBillingErrors.line1)}
        helperText={submitted ? computedBillingErrors.line1 : undefined}
      />

      <TextField
        fullWidth
        label="Adresszusatz (optional)"
        value={billingAddress.line2 || ''}
        onChange={(e) => setBilling({ line2: e.target.value })}
        margin="normal"
        autoComplete="billing address-line2"
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            required
            label="PLZ"
            value={billingAddress.postalCode}
            onChange={(e) => setBilling({ postalCode: e.target.value })}
            margin="normal"
            autoComplete="billing postal-code"
            error={Boolean(submitted && computedBillingErrors.postalCode)}
            helperText={
              submitted ? computedBillingErrors.postalCode : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            required
            label="Stadt"
            value={billingAddress.city}
            onChange={(e) => setBilling({ city: e.target.value })}
            margin="normal"
            autoComplete="billing address-level2"
            error={Boolean(submitted && computedBillingErrors.city)}
            helperText={submitted ? computedBillingErrors.city : undefined}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        required
        label={countryLabel}
        value={billingAddress.country}
        onChange={(e) => setBilling({ country: e.target.value })}
        margin="normal"
        autoComplete="billing country"
        error={Boolean(submitted && computedBillingErrors.country)}
        helperText={submitted ? computedBillingErrors.country : undefined}
      />

      <FormControlLabel
        sx={{ mt: 2 }}
        control={
          <Checkbox
            checked={shippingSameAsBilling}
            onChange={(e) => onToggleSame(e.target.checked)}
            sx={{
              color: 'black',
              '&.Mui-checked': { color: 'black' },
            }}
          />
        }
        label="Lieferadresse ist identisch zur Rechnungsadresse"
      />

      {!shippingSameAsBilling && (
        <Box mt={2}>
          <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
            {shippingTitle}
          </Typography>

          <TextField
            fullWidth
            label="Firma (optional)"
            value={shippingAddress.company || ''}
            onChange={(e) => setShipping({ company: e.target.value })}
            margin="normal"
            autoComplete="shipping organization"
          />

          <TextField
            fullWidth
            required
            label="Straße & Hausnummer"
            value={shippingAddress.line1}
            onChange={(e) => setShipping({ line1: e.target.value })}
            margin="normal"
            autoComplete="shipping street-address"
            error={Boolean(submitted && computedShippingErrors.line1)}
            helperText={submitted ? computedShippingErrors.line1 : undefined}
          />

          <TextField
            fullWidth
            label="Adresszusatz (optional)"
            value={shippingAddress.line2 || ''}
            onChange={(e) => setShipping({ line2: e.target.value })}
            margin="normal"
            autoComplete="shipping address-line2"
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="PLZ"
                value={shippingAddress.postalCode}
                onChange={(e) => setShipping({ postalCode: e.target.value })}
                margin="normal"
                autoComplete="shipping postal-code"
                error={Boolean(submitted && computedShippingErrors.postalCode)}
                helperText={
                  submitted ? computedShippingErrors.postalCode : undefined
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                required
                label="Stadt"
                value={shippingAddress.city}
                onChange={(e) => setShipping({ city: e.target.value })}
                margin="normal"
                autoComplete="shipping address-level2"
                error={Boolean(submitted && computedShippingErrors.city)}
                helperText={submitted ? computedShippingErrors.city : undefined}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            required
            label={countryLabel}
            value={shippingAddress.country}
            onChange={(e) => setShipping({ country: e.target.value })}
            margin="normal"
            autoComplete="shipping country"
            error={Boolean(submitted && computedShippingErrors.country)}
            helperText={submitted ? computedShippingErrors.country : undefined}
          />
        </Box>
      )}
    </Box>
  );
}
