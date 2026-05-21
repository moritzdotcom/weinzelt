import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Typography,
  Slide,
} from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { TransitionProps } from '@mui/material/transitions';
import { ApiGetReservationsResponse } from '@/pages/api/events/[eventId]/reservations';
import AddressInput, {
  Address,
  addressFromJson,
  defaultAddress,
} from './addressInput';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function EditReservationDialog({
  open,
  reservation,
  onClose,
  onSave,
}: {
  open: boolean;
  reservation: ApiGetReservationsResponse[number] | null;
  onClose: () => void;
  onSave: (updated: ApiGetReservationsResponse[number]) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    people: '1',
    tableCount: '1',
    minimumSpend: '0',
    internalNotes: '',
    shippingAddress: defaultAddress('DE'),
    billingAddress: defaultAddress('DE'),
    shippingSameAsBilling: true,
  });

  const [peopleChanged, setPeopleChanged] = useState(false);

  useEffect(() => {
    if (reservation) {
      setForm({
        name: reservation.name,
        email: reservation.email,
        people: `${reservation.people}`,
        tableCount: `${reservation.tableCount}`,
        minimumSpend: `${reservation.minimumSpend}`,
        internalNotes: reservation.internalNotes || '',
        shippingAddress: addressFromJson(reservation.shippingAddress),
        billingAddress: addressFromJson(reservation.billingAddress),
        shippingSameAsBilling: reservation.shippingSameAsBilling,
      });
      setPeopleChanged(false);
    }
  }, [reservation]);

  const handleChange = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      // Optional: Wenn Billing geändert wird und Shipping gleich sein soll,
      // direkt synchron halten
      if (key === 'billingAddress' && prev.shippingSameAsBilling) {
        next.shippingAddress = value as Address;
      }

      // Wenn "gleiche Adresse" aktiviert wird, Shipping direkt übernehmen
      if (key === 'shippingSameAsBilling' && value === true) {
        next.shippingAddress = prev.billingAddress;
      }

      return next;
    });

    if (key === 'people') {
      setPeopleChanged(true);
    }
  };

  const handleSubmit = () => {
    if (!reservation) return;
    onSave({
      ...reservation,
      ...form,
      people: Number(form.people),
      tableCount: Number(form.tableCount),
      minimumSpend: Number(form.minimumSpend),
    });
    setPeopleChanged(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      fullWidth
      maxWidth="md"
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
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Reservierung bearbeiten
      </DialogTitle>
      <div className="flex flex-col gap-4 px-5 py-3">
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          fullWidth
        />
        <TextField
          label="E-Mail"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          fullWidth
        />
        <TextField
          label="Personenanzahl"
          type="number"
          value={form.people}
          onChange={(e) => handleChange('people', e.target.value)}
          fullWidth
        />
        <TextField
          label="Tischanzahl"
          type="number"
          value={form.tableCount}
          onChange={(e) => handleChange('tableCount', e.target.value)}
          fullWidth
        />
        <TextField
          label="Mindestverzehr (€)"
          type="number"
          value={form.minimumSpend}
          onChange={(e) => handleChange('minimumSpend', e.target.value)}
          fullWidth
        />
        <TextField
          label="Interne Notizen"
          value={form.internalNotes}
          onChange={(e) => handleChange('internalNotes', e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Hier kannst du interne Notizen zur Reservierung hinzufügen."
        />
        <AddressInput
          submitted={true}
          billingAddress={form.billingAddress}
          onBillingAddressChange={(next) =>
            handleChange('billingAddress', next)
          }
          shippingSameAsBilling={form.shippingSameAsBilling}
          onShippingSameAsBillingChange={(next) =>
            handleChange('shippingSameAsBilling', next)
          }
          shippingAddress={form.shippingAddress}
          onShippingAddressChange={(next) =>
            handleChange('shippingAddress', next)
          }
          subtitle="Eintrittsbändchen und Verzehrgutscheine werden an diese Adresse geschickt"
        />
        {peopleChanged && (
          <Typography variant="body2" color="warning.main" mt={1}>
            Die Personenanzahl wurde von {reservation?.people} auf{' '}
            {form?.people || '0'} geändert. Bitte überprüfe den Mindestverzehr!
          </Typography>
        )}
      </div>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 500 }}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          sx={{
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 600,
            background: '#000',
            color: '#fff',
            '&:hover': { background: '#222' },
          }}
          onClick={handleSubmit}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
