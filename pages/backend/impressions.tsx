import { useEffect, useState, FormEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  LinearProgress,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CardActions,
  IconButton,
  Collapse,
} from '@mui/material';
import { Delete, Star, StarBorder } from '@mui/icons-material';

type AlbumOption = {
  id: string;
  year: number;
  day: string;
  coverUrl: string | null;
  photoCount: number;
  coverPhotoId?: string | null;
};

type Photo = {
  id: string;
  url: string;
  year: number;
  day: string;
  path: string;
  sortOrder: number;
  createdAt: string;
  albumId: string;
};

export default function AdminImpressionsPage() {
  // Album-Liste
  const [albums, setAlbums] = useState<AlbumOption[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState<string | null>(null);

  // "Album erstellen"-Form
  const [newAlbumYear, setNewAlbumYear] = useState<number>(2025);
  const [newAlbumDay, setNewAlbumDay] = useState<string>('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [createAlbumError, setCreateAlbumError] = useState<string | null>(null);

  // Upload-Form
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fotos im gewählten Album
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) || null;
  const selectedAlbumCoverId = selectedAlbum?.coverPhotoId ?? null;

  const progressValue =
    totalToUpload > 0 ? (uploadedCount / totalToUpload) * 100 : 0;

  // Alben laden
  async function loadAlbums() {
    try {
      setAlbumsLoading(true);
      setAlbumsError(null);

      const res = await fetch('/api/albums');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Laden der Alben');
      }
      const data: AlbumOption[] = await res.json();
      setAlbums(data);

      // Wenn noch kein Album gewählt ist → erstes auswählen
      if (!selectedAlbumId && data.length > 0) {
        setSelectedAlbumId(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setAlbumsError(err.message ?? 'Fehler beim Laden der Alben');
    } finally {
      setAlbumsLoading(false);
    }
  }

  // Fotos eines Albums laden
  async function loadPhotos(albumId: string) {
    if (!albumId) {
      setPhotos([]);
      return;
    }
    try {
      setPhotosLoading(true);
      setPhotosError(null);

      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Laden der Fotos');
      }
      const data: Photo[] = await res.json();
      setPhotos(data);
    } catch (err: any) {
      console.error(err);
      setPhotosError(err.message ?? 'Fehler beim Laden der Fotos');
    } finally {
      setPhotosLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbumId) {
      loadPhotos(selectedAlbumId);
    } else {
      setPhotos([]);
    }
  }, [selectedAlbumId]);

  // Album erstellen
  async function handleCreateAlbum(e: FormEvent) {
    setCreatingAlbum(true);
    setCreateAlbumError(null);

    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: newAlbumYear,
          day: newAlbumDay,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Erstellen des Albums');
      }

      const album = await res.json();
      setAlbums((prev) => {
        const next = [...prev, { ...album, coverUrl: null, photoCount: 0 }];
        // optional sortieren: neuestes Jahr zuerst
        return next.sort(
          (a, b) => b.year - a.year || a.day.localeCompare(b.day)
        );
      });
      setSelectedAlbumId(album.id);
    } catch (err: any) {
      console.error(err);
      setCreateAlbumError(err.message ?? 'Fehler beim Erstellen des Albums');
    } finally {
      setCreatingAlbum(false);
    }
  }

  // Fotos hochladen
  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0 || !selectedAlbumId) return;

    setUploading(true);
    setUploadedCount(0);
    setTotalToUpload(files.length);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('albumId', selectedAlbumId);

        const res = await fetch('/api/impressions', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload fehlgeschlagen');
        }

        const uploaded: Photo = await res.json();
        setPhotos((prev) => [...prev, uploaded]);
        setUploadedCount((c) => c + 1);
      }

      setUploadMessage(`${fileArray.length} Bild(er) erfolgreich hochgeladen.`);
      setFiles(null);
      const input = document.getElementById(
        'impressions-file-input'
      ) as HTMLInputElement | null;
      if (input) input.value = '';

      // Album-Liste aktualisieren (photoCount, evtl. cover)
      loadAlbums();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message ?? 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      setTotalToUpload(0);
    }
  }

  async function handleSetCover(photo: Photo) {
    if (!selectedAlbumId) return;
    try {
      const res = await fetch(`/api/albums/${selectedAlbumId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Setzen des Covers');
      }

      // Album-Liste updaten, damit der Stern korrekt ist
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === selectedAlbumId
            ? { ...a, coverPhotoId: photo.id, coverUrl: photo.url }
            : a
        )
      );
    } catch (err: any) {
      console.error(err);
      // optional: Error-Toast
    }
  }

  async function handleDeletePhoto(photo: Photo) {
    if (!confirm('Foto wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/impressions/${photo.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      // Album-PhotoCount im UI anpassen
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === selectedAlbumId
            ? {
                ...a,
                photoCount: Math.max(0, (a.photoCount || 1) - 1),
                coverPhotoId:
                  a.coverPhotoId === photo.id ? null : a.coverPhotoId,
              }
            : a
        )
      );
    } catch (err: any) {
      console.error(err);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        maxWidth: 1100,
        mx: 'auto',
        py: 6,
        px: 2,
      }}
    >
      {/* Abschnitt: Album erstellen */}
      <Box
        component="section"
        sx={{
          mb: 5,
          p: 3,
          borderRadius: 3,
          boxShadow: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Album erstellen
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="Jahr"
            type="number"
            value={newAlbumYear}
            onChange={(e) => setNewAlbumYear(parseInt(e.target.value, 10))}
            fullWidth
          />
          <TextField
            label="Tag / Titel"
            value={newAlbumDay}
            onChange={(e) => setNewAlbumDay(e.target.value)}
            placeholder="z.B. Opening, Daydrinking, VIP Night"
            fullWidth
          />
        </Box>
        <Collapse in={!!(newAlbumYear && newAlbumDay)} sx={{ mt: 2 }}>
          <button
            onClick={handleCreateAlbum}
            disabled={creatingAlbum}
            className="inline-block bg-black text-white px-4 py-2 rounded-full shadow hover:bg-gray-300 hover:text-black disabled:opacity-50 disabled:pointer-events-none"
          >
            {creatingAlbum ? 'Erstelle…' : 'Album erstellen'}
          </button>
        </Collapse>
        {createAlbumError && (
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            {createAlbumError}
          </Typography>
        )}
      </Box>

      {/* Abschnitt: Fotos hochladen */}
      <Box
        component="section"
        sx={{
          mb: 6,
          p: 3,
          borderRadius: 3,
          boxShadow: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Fotos in Album hochladen
        </Typography>

        {albumsLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Lade Alben…
            </Typography>
          </Box>
        )}

        {albumsError && (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {albumsError}
          </Typography>
        )}

        {albums.length === 0 && !albumsLoading ? (
          <Typography variant="body2" color="text.secondary">
            Noch keine Alben vorhanden. Bitte zuerst ein Album erstellen.
          </Typography>
        ) : (
          <>
            <Box
              component="form"
              onSubmit={handleUpload}
              sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel id="album-select-label">Album</InputLabel>
                <Select
                  labelId="album-select-label"
                  label="Album"
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                >
                  {albums.map((album) => (
                    <MenuItem key={album.id} value={album.id}>
                      {album.year} - {album.day} ({album.photoCount} Fotos)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Bilder hochladen
                </Typography>

                {/* Hidden Input */}
                <input
                  id="impressions-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setFiles(e.target.files)}
                />

                {/* Styled Upload Box */}
                <label htmlFor="impressions-file-input">
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 3,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: '0.2s',
                      '&:hover': {
                        borderColor: 'black',
                        bgcolor: 'rgba(0,0,0,0.03)',
                      },
                    }}
                  >
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      Dateien auswählen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Klicken zum Hochladen oder Dateien hierher ziehen
                    </Typography>
                  </Box>
                </label>

                {/* Anzeige ausgewählter Dateien */}
                {files && files.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Ausgewählte Dateien ({files.length})
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {Array.from(files).map((file) => (
                        <Box
                          key={file.name}
                          sx={{
                            border: '1px solid #eee',
                            borderRadius: 2,
                            p: 1,
                            width: 120,
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            overflow: 'hidden',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mb: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {file.name}
                          </Typography>

                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                              width: '100%',
                              height: 70,
                              objectFit: 'cover',
                              borderRadius: 6,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {(uploading || totalToUpload > 0) && (
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                >
                  <LinearProgress
                    variant={
                      totalToUpload > 0 ? 'determinate' : 'indeterminate'
                    }
                    value={progressValue}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {uploadedCount} / {totalToUpload} Bild(er) hochgeladen
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={
                  uploading || !files || files.length === 0 || !selectedAlbumId
                }
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                }}
              >
                {uploading ? 'Lade hoch…' : 'Fotos hochladen'}
              </Button>

              {uploadMessage && (
                <Typography variant="body2" color="success.main">
                  {uploadMessage}
                </Typography>
              )}
              {uploadError && (
                <Typography variant="body2" color="error.main">
                  {uploadError}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Vorschau: Fotos im aktuell gewählten Album */}
      <Box component="section">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Vorschau Album
          </Typography>
          {photosLoading && selectedAlbumId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Lade Fotos…
              </Typography>
            </Box>
          )}
        </Box>

        {photosError && (
          <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
            {photosError}
          </Typography>
        )}

        {!photosLoading && photos.length === 0 && selectedAlbumId && (
          <Typography variant="body2" color="text.secondary">
            Noch keine Fotos in diesem Album.
          </Typography>
        )}

        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={photo.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={photo.url}
                  alt={`Impression ${photo.year} ${photo.day}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {photo.year} · {photo.day}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', py: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleSetCover(photo)}
                    title="Als Cover setzen"
                  >
                    {selectedAlbumCoverId === photo.id ? (
                      <Star fontSize="small" color="warning" />
                    ) : (
                      <StarBorder fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePhoto(photo)}
                    title="Foto löschen"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
