// /pages/backend/impressions/[albumId].tsx

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import BackendHeader from '@/components/backend/header';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import { Session } from '@/hooks/useSession';
import { downscaleImageFile } from '@/lib/images/downscaleImageFile';

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
  path: string;
  sortOrder: number;
  createdAt: string;
  albumId: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB';

  const mb = bytes / 1024 / 1024;

  if (mb >= 1) return `${mb.toFixed(1)} MB`;

  return `${Math.round(bytes / 1024)} KB`;
}

export default function AdminImpressionAlbumPage({
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
      <ImpressionAlbumContent />
    </BackendPermissionGuard>
  );
}

function ImpressionAlbumContent() {
  const router = useRouter();
  const albumId =
    typeof router.query.albumId === 'string' ? router.query.albumId : '';

  const [album, setAlbum] = useState<AlbumOption | null>(null);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [albumError, setAlbumError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const selectedAlbumCoverId = album?.coverPhotoId ?? null;

  async function loadAlbumMeta(id: string) {
    try {
      setAlbumLoading(true);
      setAlbumError(null);

      // Nutzt deinen bestehenden /api/albums Endpoint.
      // Alternativ könntest du später einen GET /api/albums/[albumId]/meta bauen.
      const res = await fetch('/api/albums');

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Album konnte nicht geladen werden.');
      }

      const albums: AlbumOption[] = await res.json();
      const foundAlbum = albums.find((item) => item.id === id) || null;

      if (!foundAlbum) {
        throw new Error('Album nicht gefunden.');
      }

      setAlbum(foundAlbum);
    } catch (error) {
      console.error(error);
      setAlbumError(
        getErrorMessage(error, 'Album konnte nicht geladen werden.'),
      );
    } finally {
      setAlbumLoading(false);
    }
  }

  async function loadPhotos(id: string) {
    try {
      setPhotosLoading(true);
      setPhotosError(null);

      const res = await fetch(`/api/albums/${id}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fotos konnten nicht geladen werden.');
      }

      const data: Photo[] = await res.json();
      setPhotos(data);
    } catch (error) {
      console.error(error);
      setPhotosError(
        getErrorMessage(error, 'Fotos konnten nicht geladen werden.'),
      );
    } finally {
      setPhotosLoading(false);
    }
  }

  useEffect(() => {
    if (!albumId) return;

    loadAlbumMeta(albumId);
    loadPhotos(albumId);
  }, [albumId]);

  async function handleUploadSuccess(uploadedPhotos: Photo[]) {
    setPhotos((prev) => [...prev, ...uploadedPhotos]);

    setAlbum((prev) =>
      prev
        ? {
            ...prev,
            photoCount: prev.photoCount + uploadedPhotos.length,
            coverUrl: prev.coverUrl || uploadedPhotos[0]?.url || null,
          }
        : prev,
    );

    await loadAlbumMeta(albumId);
  }

  async function handleSetCover(photo: Photo) {
    if (!albumId) return;

    try {
      const res = await fetch(`/api/albums/${albumId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Setzen des Covers.');
      }

      setAlbum((prev) =>
        prev
          ? {
              ...prev,
              coverPhotoId: photo.id,
              coverUrl: photo.url,
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error, 'Fehler beim Setzen des Covers.'));
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
        throw new Error(data.error || 'Fehler beim Löschen.');
      }

      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));

      setAlbum((prev) =>
        prev
          ? {
              ...prev,
              photoCount: Math.max(0, prev.photoCount - 1),
              coverPhotoId:
                prev.coverPhotoId === photo.id ? null : prev.coverPhotoId,
              coverUrl: prev.coverPhotoId === photo.id ? null : prev.coverUrl,
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error, 'Fehler beim Löschen.'));
    }
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
        title={
          album
            ? `${album.year} - ${album.day}`
            : albumLoading
              ? 'Album wird geladen…'
              : 'Album'
        }
        subtitle="Fotos hochladen, Cover auswählen und Album-Inhalte verwalten."
        backHref="/backend/impressions"
      />

      {albumError && (
        <Box
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'error.light',
            borderRadius: 3,
            p: 2,
            bgcolor: '#fff5f5',
          }}
        >
          <Typography variant="body2" color="error.main">
            {albumError}
          </Typography>

          <Link
            href="/backend/impressions"
            className="mt-3 inline-block text-sm font-semibold text-gray-950 underline"
          >
            Zurück zur Album-Übersicht
          </Link>
        </Box>
      )}

      {!albumError && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, mt: 4 }}>
          {album && (
            <AlbumSummaryCard album={album} photosLoading={photosLoading} />
          )}

          {album && (
            <UploadSection
              albumId={album.id}
              onUploadSuccess={handleUploadSuccess}
            />
          )}

          <PhotosSection
            photos={photos}
            loading={photosLoading}
            error={photosError}
            selectedAlbumCoverId={selectedAlbumCoverId}
            onSetCover={handleSetCover}
            onDeletePhoto={handleDeletePhoto}
          />
        </Box>
      )}
    </Box>
  );
}

function AlbumSummaryCard({
  album,
  photosLoading,
}: {
  album: AlbumOption;
  photosLoading: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
        gap: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.paper',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: 1,
      }}
    >
      <Box sx={{ height: { xs: 180, md: '100%' }, bgcolor: 'grey.100' }}>
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={`${album.year} ${album.day}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'grey.500',
            }}
          >
            <PhotoLibraryRoundedIcon />
            <Typography variant="caption" sx={{ mt: 1 }}>
              Noch kein Cover
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Album
        </Typography>

        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
          {album.day}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {album.year}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`${album.photoCount} Fotos`} />
          {album.coverPhotoId ? (
            <Chip label="Cover ausgewählt" color="success" />
          ) : (
            <Chip label="Kein Cover" />
          )}
          {photosLoading && <Chip label="Fotos werden geladen…" />}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Tipp: Nach dem Upload kannst du unten mit dem Stern ein Coverbild für
          dieses Album auswählen.
        </Typography>
      </Box>
    </Box>
  );
}

function UploadSection({
  albumId,
  onUploadSuccess,
}: {
  albumId: string;
  onUploadSuccess: (photos: Photo[]) => void;
}) {
  return (
    <Box
      component="section"
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'grey.100',
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Fotos hochladen
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Große Fotos werden vor dem Upload automatisch verkleinert und
          komprimiert.
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <UploadPanel albumId={albumId} onUploadSuccess={onUploadSuccess} />
      </Box>
    </Box>
  );
}

function UploadPanel({
  albumId,
  onUploadSuccess,
}: {
  albumId: string;
  onUploadSuccess: (photos: Photo[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  const [originalBytes, setOriginalBytes] = useState(0);
  const [uploadBytes, setUploadBytes] = useState(0);

  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const progressValue =
    totalToUpload > 0 ? (uploadedCount / totalToUpload) * 100 : 0;

  const selectedBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  const filePreviews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [filePreviews]);

  function addFiles(nextFiles: FileList | File[]) {
    const imageFiles = Array.from(nextFiles).filter((file) =>
      file.type.startsWith('image/'),
    );

    setUploadMessage(null);
    setUploadError(null);
    setFiles((prev) => [...prev, ...imageFiles]);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;

    addFiles(event.target.files);
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files) {
      addFiles(event.dataTransfer.files);
    }
  }

  function removeFile(fileToRemove: File) {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();

    if (!albumId || files.length === 0) return;

    setUploading(true);
    setUploadedCount(0);
    setTotalToUpload(files.length);
    setOriginalBytes(0);
    setUploadBytes(0);
    setUploadMessage(null);
    setUploadError(null);

    const uploadedPhotos: Photo[] = [];

    try {
      let originalTotalBytes = 0;
      let uploadTotalBytes = 0;

      for (const file of files) {
        const resized = await downscaleImageFile(file, {
          maxWidth: 2400,
          maxHeight: 2400,
          quality: 0.82,
          outputType: 'image/jpeg',
        });

        originalTotalBytes += resized.originalSize;
        uploadTotalBytes += resized.resizedSize;

        setOriginalBytes(originalTotalBytes);
        setUploadBytes(uploadTotalBytes);

        const formData = new FormData();
        formData.append('file', resized.file);
        formData.append('albumId', albumId);

        const res = await fetch('/api/impressions', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Upload fehlgeschlagen: ${file.name}`);
        }

        const uploaded: Photo = await res.json();

        uploadedPhotos.push(uploaded);
        setUploadedCount((count) => count + 1);
      }

      onUploadSuccess(uploadedPhotos);

      setUploadMessage(
        `${uploadedPhotos.length} Foto(s) hochgeladen. Ursprünglich ca. ${formatBytes(
          originalTotalBytes,
        )}, Upload ca. ${formatBytes(uploadTotalBytes)}.`,
      );

      setFiles([]);
    } catch (error) {
      console.error(error);

      if (uploadedPhotos.length > 0) {
        onUploadSuccess(uploadedPhotos);
      }

      setUploadError(getErrorMessage(error, 'Upload fehlgeschlagen.'));
    } finally {
      setUploading(false);
      setTotalToUpload(0);
    }
  }

  return (
    <Box component="form" onSubmit={handleUpload}>
      <input
        id="impressions-file-input"
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={handleFileInputChange}
      />

      <label
        htmlFor="impressions-file-input"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Box
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'grey.900' : 'grey.300',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragActive ? 'rgba(0,0,0,0.04)' : 'transparent',
            transition: '0.2s',
            '&:hover': {
              borderColor: 'grey.900',
              bgcolor: 'rgba(0,0,0,0.03)',
            },
          }}
        >
          <CloudUploadRoundedIcon
            sx={{ fontSize: 38, color: 'text.secondary' }}
          />

          <Typography variant="body1" fontWeight={700} sx={{ mt: 1 }}>
            Fotos auswählen oder hierher ziehen
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Mehrere Bilder möglich. Große Bilder werden automatisch auf max.
            2400px verkleinert.
          </Typography>
        </Box>
      </label>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={700}>
                Ausgewählte Dateien ({files.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Originalgröße zusammen: {formatBytes(selectedBytes)}
              </Typography>
            </Box>

            <Button
              size="small"
              color="inherit"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Auswahl leeren
            </Button>
          </Box>

          <Grid container spacing={1.5}>
            {filePreviews.map(({ file, url }) => (
              <Grid
                size={{ xs: 6, sm: 4, md: 2 }}
                key={`${file.name}-${file.lastModified}`}
              >
                <Box
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    bgcolor: 'background.paper',
                  }}
                >
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: 96,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={() => removeFile(file)}
                    disabled={uploading}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>

                  <Box sx={{ p: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {file.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {formatBytes(file.size)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {(uploading || totalToUpload > 0) && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant={totalToUpload > 0 ? 'determinate' : 'indeterminate'}
            value={progressValue}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {uploadedCount} / {totalToUpload} Bild(er) hochgeladen
            {originalBytes > 0 &&
              ` · verarbeitet: ${formatBytes(originalBytes)} → ${formatBytes(
                uploadBytes,
              )}`}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={uploading || files.length === 0}
          sx={{
            borderRadius: 999,
            px: 3,
            py: 1,
            bgcolor: 'black',
            '&:hover': { bgcolor: 'grey.900' },
          }}
        >
          {uploading
            ? 'Lade hoch…'
            : files.length > 0
              ? `${files.length} Foto(s) hochladen`
              : 'Fotos hochladen'}
        </Button>

        {files.length > 0 && !uploading && (
          <Typography variant="body2" color="text.secondary">
            Upload erfolgt in dieses Album.
          </Typography>
        )}
      </Box>

      {uploadMessage && (
        <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
          {uploadMessage}
        </Typography>
      )}

      {uploadError && (
        <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
          {uploadError}
        </Typography>
      )}
    </Box>
  );
}

function PhotosSection({
  photos,
  loading,
  error,
  selectedAlbumCoverId,
  onSetCover,
  onDeletePhoto,
}: {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  selectedAlbumCoverId: string | null;
  onSetCover: (photo: Photo) => void;
  onDeletePhoto: (photo: Photo) => void;
}) {
  return (
    <Box component="section">
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
            Fotos im Album
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Wähle ein Coverbild aus oder lösche Fotos, die nicht angezeigt
            werden sollen.
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Lade Fotos…
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && photos.length === 0 ? (
        <EmptyPhotosState />
      ) : (
        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={photo.id}>
              <PhotoCard
                photo={photo}
                isCover={selectedAlbumCoverId === photo.id}
                onSetCover={() => onSetCover(photo)}
                onDelete={() => onDeletePhoto(photo)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function PhotoCard({
  photo,
  isCover,
  onSetCover,
  onDelete,
}: {
  photo: Photo;
  isCover: boolean;
  onSetCover: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        boxShadow: 1,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="170"
          image={photo.url}
          sx={{ objectFit: 'cover' }}
        />

        {isCover && (
          <Chip
            size="small"
            label="Cover"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              fontWeight: 700,
            }}
          />
        )}
      </Box>

      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {photo.id}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', py: 0.5 }}>
        <Button
          size="small"
          startIcon={
            isCover ? (
              <StarRoundedIcon fontSize="small" />
            ) : (
              <StarBorderRoundedIcon fontSize="small" />
            )
          }
          onClick={onSetCover}
        >
          {isCover ? 'Cover' : 'Als Cover'}
        </Button>

        <IconButton size="small" onClick={onDelete} title="Foto löschen">
          <DeleteRoundedIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

function EmptyPhotosState() {
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
        <PhotoLibraryRoundedIcon />
      </Box>

      <Typography variant="h6" fontWeight={700}>
        Noch keine Fotos in diesem Album
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}
      >
        Lade oben die ersten Fotos hoch. Danach kannst du hier ein Coverbild
        auswählen und Bilder verwalten.
      </Typography>
    </Box>
  );
}
