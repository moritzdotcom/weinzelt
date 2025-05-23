import axios from 'axios';
import { useRef, useState } from 'react';
import { ApiGetReservationsResponse } from '@/pages/api/events/[eventId]/reservations';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { translateType } from '@/lib/reservation';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export default function ReservationCard({
  reservation,
  doubleBooking,
  onUpdate,
}: {
  reservation: ApiGetReservationsResponse[number];
  doubleBooking?: ApiGetReservationsResponse[number];
  onUpdate: (reservation: ApiGetReservationsResponse[number]) => void;
}) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [notifying, setNotifying] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [savingTableNumber, setSavingTableNumber] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleConfirmPayment = async () => {
    await axios.put(`/api/reservations/${reservation.id}`, { payed: true });
    onUpdate({ ...reservation, payed: true });
    setPaymentDialogOpen(false);
    setAnchorEl(null);
  };

  const handleNotify = async () => {
    setNotifying(true);
    await axios.post(`/api/reservations/${reservation.id}/notify`);
    onUpdate({ ...reservation, notified: new Date() });
    setNotifying(false);
  };

  const handlePaymentReminder = async () => {
    await axios.post(`/api/reservations/${reservation.id}/sendPaymentReminder`);
    onUpdate({ ...reservation, paymentReminderSent: new Date() });
    setAnchorEl(null);
  };

  const handleCancelReservation = async () => {
    await axios.post(`/api/reservations/${reservation.id}/cancel`, {
      reason: cancelReason,
    });
    onUpdate({ ...reservation, confirmationState: 'DECLINED' });
    setAnchorEl(null);
  };

  const handleUpdateTableNumber = async (tableNumber: string) => {
    onUpdate({ ...reservation, tableNumber });
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (tableNumber.length <= 0) return;

    setSavingTableNumber(true);

    debounceTimeout.current = setTimeout(async () => {
      await axios.put(`/api/reservations/${reservation.id}`, { tableNumber });
      setSavingTableNumber(false);
    }, 1000);
  };

  return (
    <motion.div
      key={reservation.id}
      variants={{
        hidden: { opacity: 0, x: -30 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.4 },
        },
      }}
      className="p-4 border border-gray-200 rounded-xl shadow-sm"
    >
      <Box className="flex flex-row gap-2 justify-between items-start mb-1 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-1">
          <h6 className="text-xl font-medium">{reservation.name}</h6>
          <h6 className="text-xl font-medium">
            ({reservation.people} Personen)
          </h6>
        </div>
        <div className="flex flex-col-reverse items-end sm:flex-row sm:items-center gap-1">
          <p className="text-sm px-2 py-1 border rounded-full border-gray-300 text-gray-600">
            {translateType(reservation.type)}
          </p>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <MoreHorizIcon />
          </IconButton>
        </div>
      </Box>

      <Typography className="text-sm text-gray-500">
        {reservation.email}
      </Typography>

      <div className="flex items-center gap-2">
        <Typography className="text-sm mt-1 font-medium">
          {reservation.packageName} - {reservation.packagePrice} €
        </Typography>
        <Tooltip
          title={reservation.payed ? 'Zahlung erhalten' : 'Zahlung ausstehend'}
        >
          <button
            className={`${
              reservation.payed ? 'text-emerald-600' : 'text-amber-600'
            }`}
            onClick={() => setPaymentDialogOpen(!reservation.payed)}
          >
            {reservation.payed ? 'Bezahlt' : 'Nix Geld'}
          </button>
        </Tooltip>
      </div>

      <Typography className="text-sm text-gray-600">
        {reservation.packageDescription}
      </Typography>

      {reservation.foodCountMeat +
        reservation.foodCountFish +
        reservation.foodCountVegetarian >
        0 && (
        <ul className="text-sm text-gray-600 ml-2">
          {reservation.foodCountMeat > 0 && (
            <li>{reservation.foodCountMeat} x Fleisch</li>
          )}
          {reservation.foodCountFish > 0 && (
            <li>{reservation.foodCountFish} x Fisch</li>
          )}
          {reservation.foodCountVegetarian > 0 && (
            <li>{reservation.foodCountVegetarian} x Vegetarisch</li>
          )}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
        <Box className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <TextField
            label="Tischnummer"
            variant="outlined"
            size="small"
            sx={{ width: 200 }}
            error={Boolean(doubleBooking)}
            value={reservation.tableNumber || ''}
            onChange={(e) => handleUpdateTableNumber(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {savingTableNumber && (
                      <CircularProgress size="1.3rem" sx={{ color: 'black' }} />
                    )}
                  </InputAdornment>
                ),
              },
            }}
          />
          {doubleBooking && (
            <p className="text-red-600">Tisch doppelt belegt!</p>
          )}
        </Box>
        {reservation.notified ? (
          <Tooltip
            title={`Benachrichtigt am: ${new Date(
              reservation.notified
            ).toLocaleDateString('de')} ${
              reservation.paymentReminderSent
                ? ` - Erinnert am: ${new Date(
                    reservation.paymentReminderSent
                  ).toLocaleDateString('de')}`
                : ''
            }`}
          >
            <button className="border bg-neutral-400 text-white px-3 py-2 rounded-full flex items-center gap-1 text-base cursor-default!">
              <CheckIcon fontSize="inherit" />
              <span>Benachrichtigt</span>
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleNotify}
            disabled={notifying}
            className="border border-sky-500 text-sky-500 px-3 py-2 rounded-full flex items-center gap-1 text-base"
          >
            <MailOutlineIcon fontSize="inherit" />
            <span>Benachrichtigen</span>
          </button>
        )}
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem disabled={reservation.payed} onClick={handleConfirmPayment}>
          Zahlungseingang bestätigen
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={
            Boolean(reservation.paymentReminderSent) ||
            reservation.payed ||
            !reservation.notified ||
            new Date(reservation.notified).getTime() - new Date().getTime() <
              1000 * 60 * 60 * 24 * 7
          }
          onClick={handlePaymentReminder}
        >
          Zahlungserinnerung versenden
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={reservation.payed}
          onClick={() => {
            setAnchorEl(null);
            setCancelDialogOpen(true);
          }}
        >
          Stornieren & benachrichtigen
        </MenuItem>
      </Menu>
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
      >
        <DialogTitle>Zahlungseingang bestätigen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du den Zahlungseingang für{' '}
            <strong>{reservation.name}</strong> bestätigen?
          </Typography>
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
            onClick={() => setPaymentDialogOpen(false)}
          >
            Abbrechen
          </button>
          <button
            className="w-full shadow rounded text-white bg-green-600 hover:bg-green-700 px-3 py-2 transition hover:scale-105 ml-3"
            onClick={handleConfirmPayment}
          >
            Bestätigen
          </button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
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
            onClick={() => setCancelDialogOpen(false)}
          >
            Abbrechen
          </button>
          <button
            className="w-full shadow rounded text-white bg-red-600 hover:bg-red-700 px-3 py-2 transition hover:scale-105 ml-3"
            onClick={handleCancelReservation}
          >
            Stornieren
          </button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
