import { HelpOutline } from '@mui/icons-material';
import { Box, Typography, Divider, Tooltip } from '@mui/material';

export default function OrderSummary({
  people,
  pkg,
  drinksTotal,
  foodCount,
  menuPrice,
}: {
  people: number;
  pkg: { name: string } | null;
  drinksTotal: number;
  foodCount: number;
  menuPrice: number;
}) {
  const foodTotal = foodCount * menuPrice;
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

      {foodTotal > 0 && (
        <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
          <Typography>
            Menu ({people} × {menuPrice} €)
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

export function SimpleOrderSummary({
  personCount,
  tableCount,
  minimumSpend,
}: {
  personCount: number;
  tableCount: number;
  minimumSpend: number;
}) {
  const drinksTotal = minimumSpend * tableCount;
  const deliveryFee = 5.9;

  return (
    <Box
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

      <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
        <Typography>
          {personCount} Personen &#8793; {tableCount} Tisch
          {tableCount > 1 ? 'e' : ''}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
        <Typography>
          Getränkeguthaben ({tableCount} × {minimumSpend} €)
        </Typography>
        <Typography className="whitespace-nowrap">
          {drinksTotal.toFixed(2).replace('.', ',')} €
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" gap={2} mb={1}>
        <Box display="flex" gap="3px" alignItems="center">
          <Typography>Versand</Typography>
          <Tooltip title="Deine Einlassbändchen und Verzehrkarten werden dir vorab zugesandt">
            <HelpOutline color="info" fontSize="small" />
          </Tooltip>
        </Box>
        <Typography className="whitespace-nowrap">
          {deliveryFee.toFixed(2).replace('.', ',')} €
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box display="flex" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={600}>
          Gesamt
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          {(drinksTotal + deliveryFee).toFixed(2).replace('.', ',')} €
        </Typography>
      </Box>
    </Box>
  );
}
