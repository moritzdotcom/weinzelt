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
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { translateType } from '@/lib/reservation';
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [savingTableNumber, setSavingTableNumber] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelReservation = async () => {
    await axios.post(`/api/reservations/${reservation.id}/cancel`, {
      reason: cancelReason,
    });
    onUpdate({ ...reservation, paymentStatus: 'CANCELED' });
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
          {reservation.minimumSpend}€
        </Typography>
        <Tooltip
          title={reservation.payed ? 'Zahlung erhalten' : 'Zahlung ausstehend'}
        >
          <p
            className={`${
              reservation.payed ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {reservation.payed ? 'Bezahlt' : 'Nix Geld'}
          </p>
        </Tooltip>
      </div>

      {reservation.internalNotes && (
        <div className="my-3">
          <Divider />
          <p className="text-sm text-gray-600 mt-2 px-2">
            Notiz: {reservation.internalNotes}
          </p>
        </div>
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
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setCancelDialogOpen(true);
          }}
        >
          Stornieren & benachrichtigen
        </MenuItem>
      </Menu>
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
