import axios from 'axios';
import { useState } from 'react';
import { ApiGetReservationsResponse } from '@/pages/api/events/[eventId]/reservations';
import {
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';

export function ReservationCancelDialog({
  open,
  onClose,
  reservation,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  reservation: ApiGetReservationsResponse[number];
  onUpdate: (reservation: ApiGetReservationsResponse[number]) => void;
}) {
  const [notifyGuest, setNotifyGuest] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelReservation = async () => {
    await axios.post(`/api/reservations/${reservation.id}/cancel`, {
      reason: cancelReason,
      sendMail: notifyGuest,
    });
    onUpdate({ ...reservation, paymentStatus: 'CANCELED' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reservierung Stornieren</DialogTitle>
      <DialogContent>
        <p className="text-lg mb-3">
          Bitte gib einen Stornierungsgrund an. Dieser wird dem Kunden in der
          Stornierungsbestätigung mitgeteilt.
        </p>
        <TextField
          fullWidth
          label="Stornierungsgrund"
          placeholder="Nicht bezahlt"
          multiline
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          maxRows={4}
          minRows={2}
        />

        {reservation.stripePaymentIntentId &&
          reservation.paymentStatus === 'PAID' && (
            <Alert
              severity="warning"
              sx={{
                mt: 2.5,
                borderRadius: 2,
                alignItems: 'flex-start',
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>
                Zahlung wird automatisch erstattet
              </Typography>

              <Typography variant="body2">
                Diese Reservierung wurde bereits bezahlt. Beim Stornieren wird
                der gezahlte Betrag automatisch über Stripe zurückerstattet.
              </Typography>
            </Alert>
          )}

        <FormControlLabel
          control={
            <Checkbox
              checked={notifyGuest}
              onChange={(e) => setNotifyGuest(e.target.checked)}
              sx={{
                color: 'black',
                '&.Mui-checked': { color: 'black' },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: '#333333',
                display: 'inline',
              }}
            >
              Gast über Storno benachrichtigen
            </Typography>
          }
          sx={{
            width: '100%',
            justifyContent: 'start',
            mt: 2,
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 3,
          pb: 2,
          pt: 1,
        }}
      >
        <button
          className="w-full shadow rounded bg-gray-300 hover:bg-gray-400 px-3 py-2 transition hover:scale-105 mr-3"
          onClick={onClose}
        >
          Abbrechen
        </button>
        <button
          className="w-full shadow rounded text-white bg-red-600 hover:bg-red-700 px-3 py-2 transition hover:scale-105 ml-3"
          onClick={handleCancelReservation}
        >
          Stornieren{notifyGuest ? ' & benachrichtigen' : ''}
        </button>
      </DialogActions>
    </Dialog>
  );
}
