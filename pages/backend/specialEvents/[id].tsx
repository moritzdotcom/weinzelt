import { Session } from '@/hooks/useSession';
import { ApiGetSpecialEventResponse } from '@/pages/api/specialEvents/[specialEventId]';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';

export default function BackendSpecialEventPage({
  session,
  id,
}: {
  session: Session;
  id: string;
}) {
  const router = useRouter();
  const [specialEvent, setSpecialEvent] =
    useState<ApiGetSpecialEventResponse>();

  const handleReminderSent = () => {
    setSpecialEvent((p) =>
      p
        ? {
            ...p,
            registrations: p.registrations.map((r) => ({
              ...r,
              reminderSent: new Date(),
            })),
          }
        : undefined
    );
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`/api/eventRegistration/${id}`);
    setSpecialEvent((p) =>
      p
        ? { ...p, registrations: p.registrations.filter((r) => r.id !== id) }
        : undefined
    );
  };

  useEffect(() => {
    axios(`/api/specialEvents/${id}`).then(({ data }) => setSpecialEvent(data));
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  if (!specialEvent)
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress sx={{ color: 'black' }} />
      </Box>
    );
  return (
    <Box className="max-w-5xl mx-auto px-4 py-16">
      {/* Event Header */}
      <Box className="mb-6 text-center">
        <Typography variant="h4" className="font-semibold text-black">
          {specialEvent.name}
        </Typography>
        <Typography variant="h6" className="text-neutral-600 mt-2">
          {specialEvent.eventDate.dow}, {specialEvent.eventDate.date}
        </Typography>
      </Box>

      {/* Event Statistics */}
      <Box className="my-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Box>
          <Typography variant="body1" className="text-gray-600">
            Registrierungen:
          </Typography>
          <Typography variant="h6" className="font-bold">
            {specialEvent.registrations.length}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body1" className="text-gray-600">
            Teilnehmer:
          </Typography>
          <Typography variant="h6" className="font-bold">
            {specialEvent.registrations.reduce((a, b) => a + b.personCount, 0)}
          </Typography>
        </Box>
      </Box>

      <div className="flex justify-end">
        <ReminderEmailButton
          specialEvent={specialEvent}
          onSuccess={handleReminderSent}
        />
      </div>

      {/* Registrations Table */}
      <TableContainer component={Paper} className="my-8">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <strong>Name</strong>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <strong>E-Mail</strong>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <strong>Personen</strong>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <strong>Registriert am</strong>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <strong>Erinnert am</strong>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {specialEvent.registrations.map((registration, index) => (
              <TableRow key={index}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {registration.name}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {registration.email}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {registration.personCount}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(registration.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {registration.reminderSent
                    ? new Date(registration.reminderSent).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDelete(registration.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function ReminderEmailButton({
  specialEvent,
  onSuccess,
}: {
  specialEvent: ApiGetSpecialEventResponse;
  onSuccess: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSendEmails = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/specialEvents/${specialEvent.id}/sendReminder`);
      setFeedbackMessage('Erinnerungs-E-Mails wurden erfolgreich versendet.');
      onSuccess();
    } catch (error) {
      setFeedbackMessage('Es gab ein Problem beim Versenden der E-Mails.');
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      {/* Button, um den Dialog zu öffnen */}
      <button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium shadow-sm hover:bg-gray-800 transition"
      >
        Erinnerungs-E-Mails senden
      </button>

      {/* Bestätigungsdialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Bestätigen</DialogTitle>
        <DialogContent>
          <p>
            Willst du wirklich Erinnerungs-E-Mails an alle Teilnehmer senden?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            Abbrechen
          </Button>
          <Button onClick={handleSendEmails} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Bestätigen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback nach dem Versand */}
      <Snackbar
        open={Boolean(feedbackMessage)}
        message={feedbackMessage}
        autoHideDuration={6000}
        onClose={() => setFeedbackMessage('')}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (props) => {
  const id = props.query.id;
  return { props: { id } };
};
