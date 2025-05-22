import { FoodOptionType } from '@/lib/foodOptions';
import { PackageType } from '@/lib/packages';
import { Box, Typography, Divider } from '@mui/material';

export default function OrderSummary({
  people,
  foodOption,
  pkg,
  drinksTotal,
}: {
  people: number;
  foodOption: FoodOptionType | null;
  pkg: PackageType | null;
  drinksTotal: number;
}) {
  const foodTotal = foodOption ? (foodOption.price || 0) * people : 0;
  const grandTotal = drinksTotal + foodTotal;

  return (
    <Box
      mt={4}
      p={3}
      sx={{
        backgroundColor: '#fafafa',
        border: '1px solid #ddd',
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Bestellzusammenfassung
      </Typography>

      {pkg && (
        <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
          <Typography>{pkg.name} (Pauschal pro Tisch)</Typography>
          <Typography className="whitespace-nowrap">
            {drinksTotal.toLocaleString('de-DE')} €
          </Typography>
        </Box>
      )}

      {foodTotal > 0 && foodOption && (
        <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
          <Typography>
            {foodOption.name} ({people} × {foodOption.price} €)
          </Typography>
          <Typography className="whitespace-nowrap">
            {foodTotal.toLocaleString('de-DE')} €
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 1 }} />

      <Box display="flex" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={600}>
          Gesamt
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          {grandTotal.toLocaleString('de-DE')} €
        </Typography>
      </Box>
    </Box>
  );
}
