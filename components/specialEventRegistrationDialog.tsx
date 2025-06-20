import { isValidEmail } from '@/lib/validator';
import { ApiGetSpecialEventPublicResponse } from '@/pages/api/specialEvents/[specialEventId]/register';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, Slide, Skeleton, Divider, TextField } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import axios from 'axios';
import { forwardRef, useEffect, useState } from 'react';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SpecialEventRegistrationDialog({
  id,
  buttonLabel,
}: {
  id: string;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [specialEvent, setSpecialEvent] =
    useState<ApiGetSpecialEventPublicResponse>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [personCount, setPersonCount] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [personCountError, setPersonCountError] = useState('');
  const [formDirty, setFormDirty] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setName('');
    setEmail('');
    setPersonCount('');
    setNameError('');
    setEmailError('');
    setPersonCountError('');
    setFormDirty(false);
    setSubmitting(false);
    setShowSuccess(false);
  };

  const validate = () => {
    let errorOccured = false;
    setNameError('');
    setEmailError('');
    setPersonCountError('');
    if (name.length <= 0) {
      errorOccured = true;
      setNameError('Name darf nicht leer sein');
    }
    if (!isValidEmail(email)) {
      errorOccured = true;
      setEmailError('ungültige Email');
    }
    if (email.length <= 0) {
      errorOccured = true;
      setEmailError('Email darf nicht leer sein');
    }
    if (Number(personCount) < 1) {
      errorOccured = true;
      setPersonCountError('Personenzahl darf nicht unter 1 sein');
    }
    return errorOccured;
  };

  const handleSubmit = async () => {
    setFormDirty(true);
    const errorOccured = validate();
    if (errorOccured) return;
    setSubmitting(true);

    try {
      await axios.post(`/api/specialEvents/${id}/register`, {
        name,
        email,
        personCount: Number(personCount),
      });
      setName('');
      setEmail('');
      setPersonCount('');
      setFormDirty(false);
      setShowSuccess(true);
    } catch (error) {}
    setSubmitting(false);
  };

  useEffect(() => {
    if (!formDirty) return;
    validate();
  }, [formDirty, name, email, personCount]);

  useEffect(() => {
    if (!id) return;
    axios(`/api/specialEvents/${id}/register`).then(({ data }) =>
      setSpecialEvent(data)
    );
  }, [id]);

  return (
    <>
      <button
        className="w-full py-3 text-center bg-gray-200 inline-block text-black hover:underline text-lg"
        onClick={() => setOpen(true)}
      >
        {buttonLabel}
      </button>
      <Dialog
        open={open}
        slots={{ transition: Transition }}
        keepMounted
        fullScreen
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              px: 2,
              py: 1.5,
              bgcolor: '#f9f9f9',
              boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            },
          },
        }}
      >
        <div className="w-full max-w-3xl mx-auto">
          <button className="float-end" onClick={handleClose}>
            <CloseIcon fontSize="large" />
          </button>
          <div className="mb-5 mt-9">
            {specialEvent ? (
              <h1 className="text-3xl sm:text-4xl text-center">
                {specialEvent.name}
              </h1>
            ) : (
              <Skeleton width="50%" height={50} sx={{ mx: 'auto' }} />
            )}
          </div>
          <div className="my-3">
            {specialEvent ? (
              <h3 className="text-neutral-500">
                {specialEvent.eventDate.dow}, {specialEvent.eventDate.date} /{' '}
                {specialEvent.startTime} - {specialEvent.endTime}
              </h3>
            ) : (
              <Skeleton width="50%" height={35} />
            )}
          </div>
          <div className="mb-8">
            {specialEvent ? (
              <p>{specialEvent.description}</p>
            ) : (
              <div>
                <Skeleton height={15} sx={{ my: 1 }} />
                <Skeleton height={15} sx={{ my: 1 }} />
                <Skeleton height={15} sx={{ my: 1 }} width="70%" />
              </div>
            )}
          </div>
          {specialEvent && (
            <>
              <Divider>Jetzt Registrieren</Divider>
              {showSuccess ? (
                <div className="mt-8 rounded bg-green-200 shadow px-3 py-8 text-neutral-900 text-center">
                  Du hast dich erfolgreich registriert.
                  <br /> Wir freuen uns auf deinen Besuch!
                </div>
              ) : (
                <div>
                  <TextField
                    fullWidth
                    label="Name"
                    autoComplete="name"
                    required
                    value={name}
                    error={Boolean(nameError)}
                    helperText={nameError}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="E-Mail"
                    autoComplete="email"
                    required
                    value={email}
                    error={Boolean(emailError)}
                    helperText={emailError}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Personenanzahl"
                    required
                    value={personCount}
                    error={Boolean(personCountError)}
                    helperText={personCountError}
                    onChange={(e) => setPersonCount(e.target.value)}
                    margin="normal"
                  />
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="mt-5 w-full rounded bg-black text-white py-3 hover:bg-neutral-800"
                  >
                    {submitting ? 'Wird gesendet...' : 'Registrieren'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
