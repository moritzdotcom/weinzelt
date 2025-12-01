import { Card, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import SuccessAnimation from '../successAnimation';

export default function ReservationReminderForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function onSubmit() {
    setLoading(true);
    try {
      await axios.post('/api/reservationReminder', {
        name,
        email,
      });
      setSuccess(true);
      setName('');
      setEmail('');
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <Card className="p-6 flex flex-col gap-4 items-center w-full max-w-lg">
      {success ? (
        <SuccessAnimation />
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Erinner mich, sobald die Reservierungen geöffnet sind
          </Typography>
          <TextField
            fullWidth
            label="Dein Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Deine E-Mail Adresse"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            disabled={loading}
            onClick={onSubmit}
            className="w-full rounded-full bg-black text-white py-3 font-semibold text-center hover:bg-gray-800 transition disabled:bg-gray-600"
          >
            Benachrichtigen
          </button>
        </>
      )}
    </Card>
  );
}
