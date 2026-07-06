// /pages/backend/impressions/index.tsx

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded';
import BackendHeader from '@/components/backend/header';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import { Session } from '@/hooks/useSession';

type AlbumOption = {
  id: string;
  year: number;
  day: string;
  coverUrl: string | null;
  photoCount: number;
  coverPhotoId?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function AdminImpressionsPage({
  session,
}: {
  session: Session;
}) {
  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.IMPRESSIONS}
      deniedTitle="Kein Zugriff auf Fotos"
      deniedDescription="Du hast keine Berechtigung, Fotoalben im Backend zu verwalten."
    >
      <ImpressionsOverviewContent />
    </BackendPermissionGuard>
  );
}

function ImpressionsOverviewContent() {
  const router = useRouter();

  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);

  async function loadAlbums() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/albums');

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Laden der Alben.');
      }

      const data: AlbumOption[] = await res.json();

      setAlbums(
        data.sort((a, b) => b.year - a.year || a.day.localeCompare(b.day)),
      );
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error, 'Fehler beim Laden der Alben.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAlbum(album: AlbumOption) {
    const confirmed = confirm(
      `Album wirklich löschen?\n\n${album.year} – ${album.day}\n${album.photoCount} Foto(s)\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`,
    );

    if (!confirmed) return;

    try {
      setDeletingAlbumId(album.id);

      const res = await fetch(`/api/albums/${album.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Album konnte nicht gelöscht werden.');
      }

      setAlbums((prev) => prev.filter((item) => item.id !== album.id));
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Album konnte nicht gelöscht werden.',
      );
    } finally {
      setDeletingAlbumId(null);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  async function handleAlbumCreated(album: AlbumOption) {
    setCreateDialogOpen(false);
    await router.push(`/backend/impressions/${album.id}`);
  }

  return (
    <Box
      component="main"
      sx={{
        maxWidth: 1180,
        mx: 'auto',
        py: 6,
        px: 2,
      }}
    >
      <BackendHeader
        title="Fotoalben"
        subtitle="Verwalte die Fotoalben für die Impressionen auf der Website."
        action={
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
          >
            <AddRoundedIcon fontSize="small" />
            Neues Album
          </button>
        }
      />

      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Alben
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Öffne ein Album, um Fotos hochzuladen, Cover auszuwählen oder
              Bilder zu löschen.
            </Typography>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Lade Alben…
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Box
            sx={{
              mb: 2,
              border: '1px solid',
              borderColor: 'error.light',
              borderRadius: 3,
              p: 2,
              bgcolor: '#fff5f5',
            }}
          >
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && albums.length === 0 ? (
          <EmptyState
            title="Noch keine Alben vorhanden"
            description="Erstelle dein erstes Album. Danach wirst du direkt zur Upload-Seite weitergeleitet."
            actionLabel="Erstes Album erstellen"
            onAction={() => setCreateDialogOpen(true)}
          />
        ) : (
          <Grid container spacing={2}>
            {albums.map((album) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={album.id}>
                <AlbumCard
                  album={album}
                  deleting={deletingAlbumId === album.id}
                  onDelete={() => handleDeleteAlbum(album)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <CreateAlbumDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleAlbumCreated}
      />
    </Box>
  );
}

function AlbumCard({
  album,
  deleting,
  onDelete,
}: {
  album: AlbumOption;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <Link href={`/backend/impressions/${album.id}`} className="block">
        <div className="relative h-44 bg-gray-100">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={`${album.year} ${album.day}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
              <PhotoLibraryRoundedIcon />
              <span className="mt-2 text-xs font-medium">Noch kein Cover</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/backend/impressions/${album.id}`} className="min-w-0">
            <p className="text-sm font-medium text-gray-500">{album.year}</p>
            <h3 className="mt-0.5 truncate text-lg font-semibold text-gray-950">
              {album.day}
            </h3>
          </Link>

          <Chip
            size="small"
            label={`${album.photoCount} Fotos`}
            sx={{ fontWeight: 600 }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Link
            href={`/backend/impressions/${album.id}`}
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Album öffnen
          </Link>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
          >
            {deleting ? 'Löschen…' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAlbumDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (album: AlbumOption) => void;
}) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [day, setDay] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = !!year && day.trim().length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canCreate) return;

    try {
      setCreating(true);
      setError(null);

      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, day: day.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Erstellen des Albums.');
      }

      const album = await res.json();

      onCreated({
        ...album,
        coverUrl: album.coverUrl ?? null,
        coverPhotoId: album.coverPhotoId ?? null,
        photoCount: album.photoCount ?? 0,
      });

      setDay('');
      setYear(new Date().getFullYear());
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error, 'Fehler beim Erstellen des Albums.'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={creating ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>Neues Album erstellen</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Erstelle ein Album für einen bestimmten Tag oder ein Event. Nach dem
            Erstellen wirst du direkt zur Upload-Seite weitergeleitet.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Jahr"
              type="number"
              value={year}
              onChange={(event) => setYear(parseInt(event.target.value, 10))}
              required
              fullWidth
            />

            <TextField
              label="Titel / Tag"
              value={day}
              onChange={(event) => setDay(event.target.value)}
              placeholder="z.B. Opening, Pink Monday, Closing Night"
              required
              fullWidth
              autoFocus
            />
          </Box>

          {error && (
            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={creating} color="inherit">
            Abbrechen
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={!canCreate || creating}
            sx={{
              borderRadius: 999,
              bgcolor: 'black',
              '&:hover': { bgcolor: 'grey.900' },
            }}
          >
            {creating ? 'Erstelle…' : 'Album erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.paper',
        borderRadius: 4,
        p: 5,
        textAlign: 'center',
        boxShadow: 1,
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          mb: 2,
          width: 56,
          height: 56,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'grey.700',
        }}
      >
        <CollectionsRoundedIcon />
      </Box>

      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}
      >
        {description}
      </Typography>

      <Button
        onClick={onAction}
        variant="contained"
        startIcon={<AddRoundedIcon />}
        sx={{
          mt: 3,
          borderRadius: 999,
          bgcolor: 'black',
          '&:hover': { bgcolor: 'grey.900' },
        }}
      >
        {actionLabel}
      </Button>
    </Box>
  );
}
