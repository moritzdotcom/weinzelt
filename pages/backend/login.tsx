import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ErrorMessage from '@/components/errorMessage';
import Link from 'next/link';
import { Session } from '@/hooks/useSession';
import { TextField } from '@mui/material';

export default function LoginPage({ session }: { session: Session }) {
  const router = useRouter();
  const { status, login } = session;
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formDirty, setFormDirty] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitError('');
    e.preventDefault();
    setFormDirty(true);
    validateInputs();
    try {
      await login(email, password);
    } catch (error) {
      setSubmitError('Falsche Zugangsdaten');
    }
  };

  const validateInputs = () => {
    setEmailError('');
    setPasswordError('');
    if (email) {
      if (email.length < 3 || !/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
        setEmailError('Ungültige Email');
      }
    } else {
      setEmailError('Email darf nicht leer sein');
    }

    if (password) {
      if (password.length < 8) {
        setPasswordError('Mindestens 8 Zeichen');
      }
    } else {
      setPasswordError('Passwort darf nicht leer sein');
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (status === 'authenticated') {
      router.push('/backend');
    }
  }, [status, router.isReady]);

  useEffect(() => {
    if (formDirty) validateInputs();
  }, [email, password]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 h-screen flex flex-col justify-center">
      <img src="/logo.png" alt="WEINZELT" className="w-64 mx-auto mb-4" />
      <h2 className="text-2xl text-center font-light text-gray-600">Backend</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 mt-8">
        <div>
          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <ErrorMessage message={emailError} />
        </div>
        <div>
          <TextField
            fullWidth
            placeholder="Passwort"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <ErrorMessage message={passwordError} />
        </div>
        <ErrorMessage message={submitError} />
        <button
          className="mt-5 bg-black text-white px-3 py-3 rounded-md"
          type="submit"
        >
          Anmelden
        </button>
      </form>
      <div className="mt-4 text-center text-gray-700">
        <Link
          className="w-full block text-gray-700 border border-gray-700 px-3 py-3 rounded-md"
          href="/auth/signup"
        >
          Registrieren
        </Link>
      </div>
    </div>
  );
}
