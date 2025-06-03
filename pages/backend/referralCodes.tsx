import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Session } from '@/hooks/useSession';
import { ApiGetReferralCodesResponse } from '../api/referralCodes';
import { ApiPostReferralCodeToggleResponse } from '../api/referralCodes/[referralCodeId]/toggle';

export default function BackendEventsPage({ session }: { session: Session }) {
  const [referralCodes, setreferralCodes] =
    useState<ApiGetReferralCodesResponse>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCodes = async () => {
    const res = await axios.get<ApiGetReferralCodesResponse>(
      '/api/referralCodes'
    );
    const sorted = res.data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setLoading(false);
    setreferralCodes(sorted);
  };

  const handleUpdate = (code: ApiPostReferralCodeToggleResponse) => {
    setreferralCodes((prev) => prev.map((c) => (c.id == code.id ? code : c)));
  };

  useEffect(() => {
    setLoading(true);
    fetchCodes();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  return (
    <Box className="max-w-5xl mx-auto px-4 py-16">
      <Box className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
        <Typography variant="h4" className="text-center">
          Referral Codes verwalten
        </Typography>
        <button
          className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium shadow-sm hover:bg-gray-800 transition"
          onClick={() => setCreateDialogOpen(true)}
        >
          Neuen Code erstellen
        </button>
      </Box>
      {loading && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Skeleton variant="rounded" height={164} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      )}
      <Grid container spacing={4}>
        {referralCodes.map((code) => (
          <CodeCard key={code.id} code={code} onUpdate={handleUpdate} />
        ))}
      </Grid>

      <NewCodeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchCodes}
      />
    </Box>
  );
}

function CodeCard({
  code,
  onUpdate,
}: {
  code: ApiGetReferralCodesResponse[number];
  onUpdate: (code: ApiPostReferralCodeToggleResponse) => void;
}) {
  const toggleActive = async () => {
    try {
      const { data } = await axios.post<ApiPostReferralCodeToggleResponse>(
        `/api/referralCodes/${code.id}/toggle`,
        { valid: !code.valid }
      );
      onUpdate(data);
    } catch (error) {
      alert('Fehler');
    }
  };

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box className="rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <Typography variant="h6" className="font-semibold">
            {code.code}
          </Typography>
          <Chip
            label={code.valid ? 'Aktiv' : 'Deaktiviert'}
            color={code.valid ? 'success' : 'error'}
          />
        </div>
        <Typography className="text-sm text-gray-500 mb-2">
          {code.description}
        </Typography>
        <button
          className={`w-full rounded py-2 border mt-5 ${
            code.valid ? 'text-green-800' : 'text-red-800'
          }`}
          onClick={toggleActive}
        >
          {code.valid ? 'Deaktivieren' : 'Aktivieren'}
        </button>
      </Box>
    </Grid>
  );
}

function NewCodeDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    await axios.post('/api/referralCodes', { code, description });
    setCode('');
    setDescription('');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Neuen Referral Code erstellen</DialogTitle>
      <DialogContent>
        <TextField
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Beschreibung"
          helperText="Wird bei Buchung angezeigt"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <button
          className="px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >
          Abbrechen
        </button>
        <button
          className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 disabled:opacity-50"
          onClick={handleCreate}
          disabled={!code.trim() || !description.trim()}
        >
          Erstellen
        </button>
      </DialogActions>
    </Dialog>
  );
}
