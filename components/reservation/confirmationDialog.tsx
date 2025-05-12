import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
} from '@mui/material';

export default function ReservationConfirmationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Buchungsanfrage gesendet</DialogTitle>
      <DialogContent>
        <Typography>
          Vielen Dank! Ihre Anfrage wurde übermittelt. Sie erhalten in Kürze
          eine Rückmeldung von uns. Bitte beachten Sie: Ihre Reservierung ist
          noch nicht bestätigt.
        </Typography>
      </DialogContent>
      <DialogActions>
        <button
          className="rounded-full px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          onClick={onClose}
        >
          Weitere Reservierung
        </button>
      </DialogActions>
    </Dialog>
  );
}
