import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      slots={{ transition: Transition }}
      keepMounted
      onClose={onCancel}
      aria-describedby="confirm-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            px: 2,
            py: 1.5,
            bgcolor: '#f9f9f9',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 600,
          textAlign: 'center',
          fontSize: '1.25rem',
          mt: 1,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography
          id="confirm-dialog-description"
          sx={{ textAlign: 'center', color: '#555', mt: 1 }}
        >
          {description}
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
        <Button
          onClick={onCancel}
          variant="text"
          sx={{
            flex: 1,
            mr: 1,
            color: '#777',
            fontWeight: 500,
            borderRadius: 2,
            bgcolor: '#eaeaea',
            '&:hover': { bgcolor: '#ddd' },
          }}
        >
          Abbrechen
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            flex: 1,
            ml: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0px 4px 12px rgba(255,0,0,0.15)',
          }}
        >
          Löschen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
