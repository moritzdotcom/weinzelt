import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Typography,
  Slide,
  Box,
} from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { TransitionProps } from '@mui/material/transitions';
import { ApiGetReservationsResponse } from '@/pages/api/events/[eventId]/reservations';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function EditReservationDialog({
  reservation,
  onClose,
  onSave,
}: {
  reservation: ApiGetReservationsResponse[number] | null;
  onClose: () => void;
  onSave: (updated: ApiGetReservationsResponse[number]) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    people: '1',
    packagePrice: '0',
    foodCountMeat: '0',
    foodCountVegetarian: '0',
    totalFoodPrice: '0',
    internalNotes: '',
  });

  const [peopleChanged, setPeopleChanged] = useState(false);
  const [foodMismatch, setFoodMismatch] = useState(false);

  useEffect(() => {
    if (reservation) {
      setForm({
        name: reservation.name,
        email: reservation.email,
        people: `${reservation.people}`,
        packagePrice: `${reservation.packagePrice}`,
        foodCountMeat: `${reservation.foodCountMeat}`,
        foodCountVegetarian: `${reservation.foodCountVegetarian}`,
        totalFoodPrice: `${reservation.totalFoodPrice}`,
        internalNotes: reservation.internalNotes || '',
      });
      setPeopleChanged(false);
      setFoodMismatch(false);
    }
  }, [reservation]);

  useEffect(() => {
    if (reservation?.type == 'VIP' && reservation.seating.foodRequired) {
      const totalFood =
        Number(form.foodCountMeat) + Number(form.foodCountVegetarian);
      setFoodMismatch(totalFood !== Number(form.people));
    }
  }, [form.people, form.foodCountMeat, form.foodCountVegetarian]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

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
      packagePrice: Number(form.packagePrice),
      foodCountMeat: Number(form.foodCountMeat),
      foodCountVegetarian: Number(form.foodCountVegetarian),
      totalFoodPrice: Number(form.totalFoodPrice),
    });
    setPeopleChanged(false);
  };

  return (
    <Dialog
      open={!!reservation}
      onClose={onClose}
      slots={{ transition: Transition }}
      fullWidth
      maxWidth="sm"
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
          label="Paketpreis (€)"
          type="number"
          value={form.packagePrice}
          onChange={(e) => handleChange('packagePrice', e.target.value)}
          fullWidth
        />
        {reservation?.type === 'VIP' && (
          <>
            <Box className="flex gap-2">
              <TextField
                label="Anzahl Fleisch"
                type="number"
                value={form.foodCountMeat}
                onChange={(e) => handleChange('foodCountMeat', e.target.value)}
                fullWidth
              />
              <TextField
                label="Anzahl Vegetarisch"
                type="number"
                value={form.foodCountVegetarian}
                onChange={(e) =>
                  handleChange('foodCountVegetarian', e.target.value)
                }
                fullWidth
              />
            </Box>
            <TextField
              label="Essenspreis insgesamt (€)"
              type="number"
              value={form.totalFoodPrice}
              onChange={(e) => handleChange('totalFoodPrice', e.target.value)}
              fullWidth
            />
          </>
        )}
        <TextField
          label="Interne Notizen"
          value={form.internalNotes}
          onChange={(e) => handleChange('internalNotes', e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Hier kannst du interne Notizen zur Reservierung hinzufügen."
        />
        {peopleChanged && (
          <Typography variant="body2" color="warning.main" mt={1}>
            Die Personenanzahl wurde von {reservation?.people} auf{' '}
            {form?.people || '0'} geändert. Bitte überprüfe die{' '}
            {reservation?.type == 'VIP' && 'Essensanzahl und '}
            Preise!
          </Typography>
        )}
        {foodMismatch && (
          <Typography variant="body2" color="error" mt={1}>
            Die Summe aus Fleisch und vegetarischen Gerichten muss der
            Personenanzahl entsprechen.
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
          disabled={foodMismatch}
          onClick={handleSubmit}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
