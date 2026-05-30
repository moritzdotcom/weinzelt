import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { PublicSpecialEvent } from '@/lib/specialEvents';
import { SpecialEventRegistrationForm } from '@/components/specialEventRegistrationForm';

export function SpecialEventRegistrationDialog({
  event,
  open,
  onClose,
  onRegistered,
}: {
  event: PublicSpecialEvent | null;
  open: boolean;
  onClose: () => void;
  onRegistered?: () => void;
}) {
  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          WineEvent
        </Typography>

        <Typography variant="h5" fontWeight={800}>
          Für {event.name} anmelden
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: 2 }}>
        <SpecialEventRegistrationForm
          event={event}
          onRegistered={onRegistered}
        />
      </DialogContent>

      <DialogActions sx={{ px: { xs: 3, sm: 4 }, pb: 3 }}>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
