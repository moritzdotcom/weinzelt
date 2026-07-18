import type { Session } from '@/hooks/useSession';
import BackendHeader from '@/components/backend/header';
import BackendPermissionGuard from '@/components/backend/BackendPermissionGuard';
import EventSelector from '@/components/eventSelector';
import { BACKEND_PERMISSIONS } from '@/lib/backend/permissions';
import {
  AccessTimeOutlined,
  GroupsOutlined,
  NotesOutlined,
  RestartAlt,
  SaveOutlined,
  Search,
  TableRestaurantOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ReservationPaymentStatus, ReservationType } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ApiGetEventsResponse } from '../../api/events';
import type {
  ApiGetTableNumbersResponse,
  ApiPutTableNumbersResponse,
  TableNumberReservation,
} from '../../api/eventDates/[eventDateId]/tableNumbers';

type PaymentFilter = 'ACTIVE' | ReservationPaymentStatus;
type ReservationTypeFilter = 'ALL' | ReservationType;
type DraftValues = Record<string, string>;

type DoubleSlotGroup = {
  id: string;
  reservations: TableNumberReservation[];
};

type ParsedTableNumber = {
  key: string;
  label: string;
};

type TableNumberConflict = {
  tableNumber: string;
  timeslot: string;
  reservationIds: string[];
  reservationNames: string[];
};

type SnackbarState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
};

export default function BackendReservationTableNumbersPage({
  session,
}: {
  session: Session;
}) {
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [selectedEventDateId, setSelectedEventDateId] = useState('');
  const [data, setData] = useState<ApiGetTableNumbersResponse>();
  const [draftValues, setDraftValues] = useState<DraftValues>({});

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ACTIVE');
  const [reservationTypeFilter, setReservationTypeFilter] =
    useState<ReservationTypeFilter>(ReservationType.VIP);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: 'success',
    message: '',
  });

  const sortedEventDates = useMemo(() => {
    if (!selectedEvent) return [];

    return [...selectedEvent.eventDates].sort(
      (a, b) => parseGermanDate(a.date) - parseGermanDate(b.date),
    );
  }, [selectedEvent]);

  useEffect(() => {
    if (!router.isReady) return;

    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [router, router.isReady, session.status]);

  useEffect(() => {
    if (sortedEventDates.length === 0) {
      setSelectedEventDateId('');
      setData(undefined);
      return;
    }

    setSelectedEventDateId((current) => {
      const stillExists = sortedEventDates.some(({ id }) => id === current);
      return stillExists ? current : sortedEventDates[0].id;
    });
  }, [sortedEventDates]);

  const fetchTableNumbers = useCallback(async () => {
    if (!selectedEventDateId) {
      setData(undefined);
      return;
    }

    setLoading(true);
    setLoadError(undefined);

    try {
      const response = await axios.get<ApiGetTableNumbersResponse>(
        `/api/eventDates/${selectedEventDateId}/tableNumbers`,
      );

      setData(response.data);
      setDraftValues({});
    } catch (error) {
      setData(undefined);
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedEventDateId]);

  useEffect(() => {
    fetchTableNumbers();
  }, [fetchTableNumbers]);

  const reservationById = useMemo(() => {
    return new Map(
      (data?.reservations ?? []).map((reservation) => [
        reservation.id,
        reservation,
      ]),
    );
  }, [data]);

  const getEffectiveTableNumber = useCallback(
    (reservation: TableNumberReservation) => {
      if (hasOwn(draftValues, reservation.id)) {
        return draftValues[reservation.id];
      }

      return reservation.tableNumber ?? '';
    },
    [draftValues],
  );

  const tableNumberConflicts = useMemo(() => {
    if (!data) {
      return new Map<string, TableNumberConflict[]>();
    }

    const activeReservations = data.reservations.filter(
      ({ paymentStatus }) =>
        paymentStatus === ReservationPaymentStatus.PAID ||
        paymentStatus === ReservationPaymentStatus.PENDING_PAYMENT,
    );

    return buildTableNumberConflicts(
      activeReservations,
      getEffectiveTableNumber,
    );
  }, [data, getEffectiveTableNumber]);

  const tableNumberConflictCount = useMemo(
    () => countUniqueTableNumberConflicts(tableNumberConflicts),
    [tableNumberConflicts],
  );

  const hasTableNumberConflicts = tableNumberConflictCount > 0;

  const setReservationTableNumber = useCallback(
    (reservation: TableNumberReservation, value: string) => {
      const originalValue = normalizeTableNumber(reservation.tableNumber);
      const newValue = normalizeTableNumber(value);

      setDraftValues((current) => {
        const next = { ...current };

        if (newValue === originalValue) {
          delete next[reservation.id];
        } else {
          next[reservation.id] = value;
        }

        return next;
      });
    },
    [],
  );

  const setGroupTableNumber = useCallback(
    (reservations: TableNumberReservation[], value: string) => {
      setDraftValues((current) => {
        const next = { ...current };
        const normalizedValue = normalizeTableNumber(value);

        for (const reservation of reservations) {
          const originalValue = normalizeTableNumber(reservation.tableNumber);

          if (normalizedValue === originalValue) {
            delete next[reservation.id];
          } else {
            next[reservation.id] = value;
          }
        }

        return next;
      });
    },
    [],
  );

  const resetReservation = useCallback((reservationId: string) => {
    setDraftValues((current) => {
      if (!hasOwn(current, reservationId)) return current;

      const next = { ...current };
      delete next[reservationId];
      return next;
    });
  }, []);

  const statusTypeFilteredReservations = useMemo(() => {
    if (!data) return [];

    return data.reservations.filter((reservation) => {
      if (
        paymentFilter !== 'ACTIVE' &&
        reservation.paymentStatus !== paymentFilter
      ) {
        return false;
      }

      if (
        reservationTypeFilter !== 'ALL' &&
        reservation.type !== reservationTypeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [data, paymentFilter, reservationTypeFilter]);

  const matchesSearch = useCallback(
    (reservation: TableNumberReservation) => {
      const normalizedSearch = search.trim().toLocaleLowerCase('de-DE');
      if (!normalizedSearch) return true;

      const searchable = [
        reservation.name,
        reservation.email,
        reservation.internalNotes,
        getEffectiveTableNumber(reservation),
        reservation.seating.timeslot,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('de-DE');

      return searchable.includes(normalizedSearch);
    },
    [getEffectiveTableNumber, search],
  );

  const allDoubleSlotGroups = useMemo(
    () => buildDoubleSlotGroups(statusTypeFilteredReservations),
    [statusTypeFilteredReservations],
  );

  const visibleDoubleSlotGroups = useMemo(() => {
    return allDoubleSlotGroups.filter((group) => {
      if (!group.reservations.some(matchesSearch)) return false;

      if (!onlyUnassigned) return true;

      return group.reservations.some(
        (reservation) =>
          normalizeTableNumber(getEffectiveTableNumber(reservation)) === '',
      );
    });
  }, [
    allDoubleSlotGroups,
    getEffectiveTableNumber,
    matchesSearch,
    onlyUnassigned,
  ]);

  const groupedReservationIds = useMemo(
    () =>
      new Set(
        allDoubleSlotGroups.flatMap((group) =>
          group.reservations.map(({ id }) => id),
        ),
      ),
    [allDoubleSlotGroups],
  );

  const timeslotSections = useMemo(() => {
    const byTimeslot = new Map<string, TableNumberReservation[]>();

    for (const reservation of statusTypeFilteredReservations) {
      if (groupedReservationIds.has(reservation.id)) continue;
      if (!matchesSearch(reservation)) continue;

      if (
        onlyUnassigned &&
        normalizeTableNumber(getEffectiveTableNumber(reservation)) !== ''
      ) {
        continue;
      }

      const list = byTimeslot.get(reservation.seating.timeslot) ?? [];
      list.push(reservation);
      byTimeslot.set(reservation.seating.timeslot, list);
    }

    return [...byTimeslot.entries()]
      .sort(
        ([timeslotA], [timeslotB]) =>
          getTimeslotSortValue(timeslotA) - getTimeslotSortValue(timeslotB),
      )
      .map(([timeslot, reservations]) => ({
        timeslot,
        reservations: sortReservations(reservations),
      }));
  }, [
    getEffectiveTableNumber,
    groupedReservationIds,
    matchesSearch,
    onlyUnassigned,
    statusTypeFilteredReservations,
  ]);

  const stats = useMemo(() => {
    const assigned = statusTypeFilteredReservations.filter(
      (reservation) =>
        normalizeTableNumber(getEffectiveTableNumber(reservation)) !== '',
    ).length;

    return {
      total: statusTypeFilteredReservations.length,
      assigned,
      unassigned: statusTypeFilteredReservations.length - assigned,
      doubleSlots: allDoubleSlotGroups.length,
    };
  }, [
    allDoubleSlotGroups.length,
    getEffectiveTableNumber,
    statusTypeFilteredReservations,
  ]);

  const dirtyCount = Object.keys(draftValues).length;

  const handleSave = async () => {
    if (!selectedEventDateId || dirtyCount === 0) return;

    if (hasTableNumberConflicts) {
      setSnackbar({
        open: true,
        severity: 'error',
        message:
          'Einige Tische sind im selben Timeslot mehrfach vergeben. Bitte behebe zuerst alle Konflikte.',
      });
      return;
    }

    const updates = Object.entries(draftValues)
      .filter(([reservationId]) => reservationById.has(reservationId))
      .map(([reservationId, tableNumber]) => ({
        reservationId,
        tableNumber: normalizeTableNumber(tableNumber) || null,
      }));

    if (updates.length === 0) return;

    setSaving(true);

    try {
      const response = await axios.put<ApiPutTableNumbersResponse>(
        `/api/eventDates/${selectedEventDateId}/tableNumbers`,
        { updates },
      );

      const updatedById = new Map(
        response.data.updated.map((reservation) => [
          reservation.id,
          reservation.tableNumber,
        ]),
      );

      setData((current) =>
        current
          ? {
              ...current,
              reservations: current.reservations.map((reservation) =>
                updatedById.has(reservation.id)
                  ? {
                      ...reservation,
                      tableNumber: updatedById.get(reservation.id) ?? null,
                    }
                  : reservation,
              ),
            }
          : current,
      );
      setDraftValues({});
      setSnackbar({
        open: true,
        severity: 'success',
        message: `${response.data.updated.length} Tischnummer${
          response.data.updated.length === 1 ? '' : 'n'
        } gespeichert.`,
      });
    } catch (error) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const hasVisibleReservations =
    visibleDoubleSlotGroups.length > 0 || timeslotSections.length > 0;

  return (
    <BackendPermissionGuard
      session={session}
      permission={BACKEND_PERMISSIONS.RESERVATIONS}
      deniedTitle="Kein Zugriff auf die Tischbelegung"
      deniedDescription="Du hast keine Berechtigung, die Tischbelegung zu verwalten."
    >
      <Box className="h-screen overflow-y-auto overflow-x-hidden bg-neutral-50">
        <Box className="mx-auto max-w-7xl px-4 pb-32 pt-12">
          <BackendHeader title="Tischbelegung" />

          <Paper className="mt-7 p-4 md:p-5" variant="outlined">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <EventSelector
                onChange={(event) => {
                  setSelectedEvent(event);
                  setData(undefined);
                  setDraftValues({});
                }}
              />

              <TextField
                select
                label="Veranstaltungstag"
                value={selectedEventDateId}
                disabled={sortedEventDates.length === 0}
                onChange={(event) => setSelectedEventDateId(event.target.value)}
              >
                {sortedEventDates.map((eventDate) => (
                  <MenuItem key={eventDate.id} value={eventDate.id}>
                    {eventDate.dow}, {eventDate.date}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Suche"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, E-Mail, Tisch oder Hinweis"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="Zahlungsstatus"
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value as PaymentFilter)
                }
              >
                <MenuItem value="ACTIVE">Bezahlt &amp; offen</MenuItem>
                <MenuItem value={ReservationPaymentStatus.PAID}>
                  Bezahlt
                </MenuItem>
                <MenuItem value={ReservationPaymentStatus.PENDING_PAYMENT}>
                  Zahlung offen
                </MenuItem>
              </TextField>

              <TextField
                select
                label="Reservierungsart"
                value={reservationTypeFilter}
                onChange={(event) =>
                  setReservationTypeFilter(
                    event.target.value as ReservationTypeFilter,
                  )
                }
              >
                <MenuItem value={ReservationType.VIP}>VIP</MenuItem>
                <MenuItem value={ReservationType.STANDING}>Stehplatz</MenuItem>
                <MenuItem value="ALL">Alle</MenuItem>
              </TextField>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyUnassigned}
                    onChange={(event) =>
                      setOnlyUnassigned(event.target.checked)
                    }
                  />
                }
                label="Nur Reservierungen ohne Tischnummer"
              />

              {dirtyCount > 0 && (
                <Button
                  color="inherit"
                  startIcon={<RestartAlt />}
                  onClick={() => setDraftValues({})}
                >
                  Änderungen verwerfen
                </Button>
              )}
            </div>
          </Paper>

          {data && !loading && (
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Reservierungen" value={stats.total} />
              <StatCard label="Zugeordnet" value={stats.assigned} />
              <StatCard label="Noch offen" value={stats.unassigned} />
              <StatCard label="Doppel-Slots" value={stats.doubleSlots} />
            </div>
          )}

          {data && !loading && hasTableNumberConflicts && (
            <Alert
              className="mt-5"
              icon={<WarningAmberOutlined />}
              severity="error"
            >
              <Typography fontWeight={700}>
                {tableNumberConflictCount} doppelte Tischbelegung
                {tableNumberConflictCount === 1 ? '' : 'en'} erkannt
              </Typography>
              <Typography variant="body2">
                Eine Tischnummer darf innerhalb desselben Timeslots nur einmal
                vergeben sein. In aufeinanderfolgenden Timeslots darf derselbe
                Tisch erneut verwendet werden.
              </Typography>
            </Alert>
          )}

          <Box className="mt-7">
            {!selectedEvent ? (
              <EmptyState text="Bitte wähle zuerst ein Event aus." />
            ) : !selectedEventDateId ? (
              <EmptyState text="Für dieses Event sind keine Veranstaltungstage vorhanden." />
            ) : loading ? (
              <Box className="flex min-h-64 items-center justify-center">
                <CircularProgress />
              </Box>
            ) : loadError ? (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={fetchTableNumbers}
                  >
                    Erneut laden
                  </Button>
                }
              >
                {loadError}
              </Alert>
            ) : !data ? null : !hasVisibleReservations ? (
              <EmptyState
                text={
                  onlyUnassigned
                    ? 'Alle sichtbaren Reservierungen haben bereits eine Tischnummer.'
                    : 'Für die gewählten Filter wurden keine Reservierungen gefunden.'
                }
              />
            ) : (
              <div className="space-y-10">
                {visibleDoubleSlotGroups.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <Typography variant="h5" fontWeight={700}>
                          Doppel-Slot-Reservierungen
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          Eine Eingabe wird automatisch für alle direkt
                          aufeinanderfolgenden Slots gespeichert.
                        </Typography>
                      </div>

                      <Chip
                        icon={<AccessTimeOutlined />}
                        label={`${visibleDoubleSlotGroups.length} Gruppe${
                          visibleDoubleSlotGroups.length === 1 ? '' : 'n'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {visibleDoubleSlotGroups.map((group) => (
                        <DoubleSlotCard
                          key={group.id}
                          group={group}
                          getEffectiveTableNumber={getEffectiveTableNumber}
                          onChange={setGroupTableNumber}
                          onResetReservation={resetReservation}
                          draftValues={draftValues}
                          conflictsByReservationId={tableNumberConflicts}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {timeslotSections.map((section) => (
                  <TimeslotSection
                    key={section.timeslot}
                    timeslot={section.timeslot}
                    reservations={section.reservations}
                    draftValues={draftValues}
                    getEffectiveTableNumber={getEffectiveTableNumber}
                    onChange={setReservationTableNumber}
                    onReset={resetReservation}
                    conflictsByReservationId={tableNumberConflicts}
                  />
                ))}
              </div>
            )}
          </Box>
        </Box>

        {dirtyCount > 0 && (
          <Paper
            elevation={8}
            className="fixed bottom-0 left-0 right-0 z-40 border-t"
            square
          >
            <Box className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Typography fontWeight={700}>
                  {dirtyCount} ungespeicherte Änderung
                  {dirtyCount === 1 ? '' : 'en'}
                </Typography>
                <Typography
                  color={hasTableNumberConflicts ? 'error' : 'text.secondary'}
                  variant="body2"
                >
                  {hasTableNumberConflicts
                    ? `${tableNumberConflictCount} doppelte Tischbelegung${
                        tableNumberConflictCount === 1 ? '' : 'en'
                      } müssen vor dem Speichern behoben werden.`
                    : 'Änderungen werden erst nach dem Speichern übernommen.'}
                </Typography>
              </div>

              <div className="flex gap-2">
                <Button
                  color="inherit"
                  disabled={saving}
                  onClick={() => setDraftValues({})}
                >
                  Verwerfen
                </Button>
                <Button
                  variant="contained"
                  disabled={saving || hasTableNumberConflicts}
                  startIcon={
                    saving ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      <SaveOutlined />
                    )
                  }
                  onClick={handleSave}
                >
                  Alle speichern
                </Button>
              </div>
            </Box>
          </Paper>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={() =>
            setSnackbar((current) => ({ ...current, open: false }))
          }
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() =>
              setSnackbar((current) => ({ ...current, open: false }))
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </BackendPermissionGuard>
  );
}

function DoubleSlotCard({
  group,
  draftValues,
  getEffectiveTableNumber,
  onChange,
  onResetReservation,
  conflictsByReservationId,
}: {
  group: DoubleSlotGroup;
  draftValues: DraftValues;
  getEffectiveTableNumber: (reservation: TableNumberReservation) => string;
  onChange: (reservations: TableNumberReservation[], value: string) => void;
  onResetReservation: (reservationId: string) => void;
  conflictsByReservationId: Map<string, TableNumberConflict[]>;
}) {
  const reservations = [...group.reservations].sort(
    (a, b) =>
      getTimeslotSortValue(a.seating.timeslot) -
      getTimeslotSortValue(b.seating.timeslot),
  );
  const firstReservation = reservations[0];

  const effectiveValues = reservations.map((reservation) =>
    normalizeTableNumber(getEffectiveTableNumber(reservation)),
  );
  const uniqueEffectiveValues = [...new Set(effectiveValues)];
  const hasDifferentTableNumbers = uniqueEffectiveValues.length > 1;
  const inputValue = hasDifferentTableNumbers
    ? ''
    : (uniqueEffectiveValues[0] ?? '');
  const isDirty = reservations.some((reservation) =>
    hasOwn(draftValues, reservation.id),
  );
  const conflicts = getGroupTableNumberConflicts(
    reservations,
    conflictsByReservationId,
  );
  const hasConflict = conflicts.length > 0;

  const notes = [
    ...new Set(
      reservations
        .map(({ internalNotes }) => internalNotes?.trim())
        .filter((note): note is string => Boolean(note)),
    ),
  ];

  return (
    <Card variant="outlined" className="h-full">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="h6" fontWeight={700}>
                {firstReservation.name}
              </Typography>
              <ReservationTypeChip type={firstReservation.type} />
              <Chip
                size="small"
                label={`${reservations.length} Slots`}
                color="primary"
              />
              {isDirty && (
                <Chip size="small" label="Geändert" color="warning" />
              )}
              {hasConflict && (
                <Chip size="small" label="Doppelt belegt" color="error" />
              )}
            </div>
            <Typography color="text.secondary" variant="body2">
              {firstReservation.email}
            </Typography>
          </div>

          <PaymentStatusChip status={firstReservation.paymentStatus} />
        </div>

        <div className="flex flex-wrap gap-2">
          {reservations.map((reservation) => (
            <Chip
              key={reservation.id}
              icon={<AccessTimeOutlined />}
              label={reservation.seating.timeslot}
              variant="outlined"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoItem
            icon={<GroupsOutlined fontSize="small" />}
            label={`${firstReservation.people} Personen`}
          />
          <InfoItem
            icon={<TableRestaurantOutlined fontSize="small" />}
            label={`${firstReservation.tableCount} Tisch${
              firstReservation.tableCount === 1 ? '' : 'e'
            } benötigt`}
          />
        </div>

        {notes.length > 0 && (
          <Alert icon={<NotesOutlined />} severity="info">
            {notes.map((note) => (
              <div key={note}>{note}</div>
            ))}
          </Alert>
        )}

        {hasConflict && (
          <Alert icon={<WarningAmberOutlined />} severity="error">
            <Typography variant="body2" fontWeight={700}>
              Mindestens eine Tischnummer ist im jeweiligen Timeslot bereits
              vergeben.
            </Typography>
            <Typography variant="body2" className="mt-1">
              {getGroupConflictHelperText(reservations, conflicts)}
            </Typography>
          </Alert>
        )}

        {hasDifferentTableNumbers && (
          <Alert icon={<WarningAmberOutlined />} severity="warning">
            <Typography variant="body2" fontWeight={700}>
              Die Slots haben aktuell unterschiedliche Tischnummern.
            </Typography>
            <div className="mt-1 space-y-0.5">
              {reservations.map((reservation) => (
                <Typography key={reservation.id} variant="body2">
                  {reservation.seating.timeslot}:{' '}
                  <strong>
                    {normalizeTableNumber(
                      getEffectiveTableNumber(reservation),
                    ) || 'nicht zugeordnet'}
                  </strong>
                </Typography>
              ))}
            </div>
          </Alert>
        )}

        <div className="flex items-start gap-2">
          <TextField
            fullWidth
            error={hasConflict}
            label="Gemeinsame Tischnummer"
            value={inputValue}
            placeholder={
              hasDifferentTableNumbers
                ? 'Gemeinsame Tischnummer eintragen'
                : 'z. B. 12 oder 12, 13'
            }
            helperText={
              hasConflict
                ? 'Bitte behebe die doppelte Belegung vor dem Speichern.'
                : `Wird für ${reservations.length} Reservierungen übernommen.`
            }
            onChange={(event) => onChange(reservations, event.target.value)}
          />

          {isDirty && (
            <Tooltip title="Änderungen dieser Gruppe zurücksetzen">
              <Button
                color="inherit"
                sx={{ minWidth: 48, height: 56 }}
                onClick={() =>
                  reservations.forEach(({ id }) => onResetReservation(id))
                }
              >
                <RestartAlt />
              </Button>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const RESERVATION_TYPE_ORDER: Record<TableNumberReservation['type'], number> = {
  VIP: 0,
  STANDING: 1,
};

function sortReservations(
  reservations: TableNumberReservation[],
): TableNumberReservation[] {
  return [...reservations].sort((a, b) => {
    const typeDifference =
      RESERVATION_TYPE_ORDER[a.type] - RESERVATION_TYPE_ORDER[b.type];

    if (typeDifference !== 0) {
      return typeDifference;
    }

    return a.name.localeCompare(b.name, 'de-DE', {
      sensitivity: 'base',
    });
  });
}

function TimeslotSection({
  timeslot,
  reservations,
  draftValues,
  getEffectiveTableNumber,
  onChange,
  onReset,
  conflictsByReservationId,
}: {
  timeslot: string;
  reservations: TableNumberReservation[];
  draftValues: DraftValues;
  getEffectiveTableNumber: (reservation: TableNumberReservation) => string;
  onChange: (reservation: TableNumberReservation, value: string) => void;
  onReset: (reservationId: string) => void;
  conflictsByReservationId: Map<string, TableNumberConflict[]>;
}) {
  return (
    <section className="space-y-3">
      <div className="sticky top-0 z-20 -mx-4 border-b px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AccessTimeOutlined color="action" />
            <Typography variant="h6" fontWeight={700}>
              {timeslot}
            </Typography>
          </div>
          <Chip
            size="small"
            label={`${reservations.length} Reservierung${
              reservations.length === 1 ? '' : 'en'
            }`}
          />
        </div>
      </div>

      <Paper variant="outlined" className="overflow-hidden">
        {sortReservations(reservations).map((reservation, index) => (
          <Box key={reservation.id}>
            {index > 0 && <Divider />}
            <ReservationRow
              reservation={reservation}
              value={getEffectiveTableNumber(reservation)}
              isDirty={hasOwn(draftValues, reservation.id)}
              conflicts={conflictsByReservationId.get(reservation.id) ?? []}
              onChange={(value) => onChange(reservation, value)}
              onReset={() => onReset(reservation.id)}
            />
          </Box>
        ))}
      </Paper>
    </section>
  );
}

function ReservationRow({
  reservation,
  value,
  isDirty,
  conflicts,
  onChange,
  onReset,
}: {
  reservation: TableNumberReservation;
  value: string;
  isDirty: boolean;
  conflicts: TableNumberConflict[];
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const hasConflict = conflicts.length > 0;

  return (
    <Box className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(220px,1.2fr)_130px_130px_minmax(220px,1fr)_minmax(220px,0.8fr)] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Typography fontWeight={700}>{reservation.name}</Typography>

          <ReservationTypeChip type={reservation.type} />

          {isDirty && <Chip size="small" label="Geändert" color="warning" />}

          {hasConflict && (
            <Chip size="small" label="Doppelt belegt" color="error" />
          )}
        </div>

        <Typography color="text.secondary" variant="body2" className="truncate">
          {reservation.email}
        </Typography>

        <div className="mt-2">
          <PaymentStatusChip status={reservation.paymentStatus} />
        </div>
      </div>

      <InfoItem
        icon={<GroupsOutlined fontSize="small" />}
        label={`${reservation.people} Personen`}
      />

      <InfoItem
        icon={<TableRestaurantOutlined fontSize="small" />}
        label={`${reservation.tableCount} Tisch${
          reservation.tableCount === 1 ? '' : 'e'
        }`}
      />

      <div>
        {reservation.internalNotes ? (
          <Alert icon={<NotesOutlined />} severity="info">
            {reservation.internalNotes}
          </Alert>
        ) : (
          <Typography color="text.secondary" variant="body2">
            Kein interner Hinweis
          </Typography>
        )}
      </div>

      <div>
        <div className="flex items-start gap-2">
          <TextField
            fullWidth
            error={hasConflict}
            label="Tischnummer"
            value={value}
            placeholder={
              reservation.tableCount > 1 ? 'z. B. 12, 13' : 'z. B. 12'
            }
            helperText={
              hasConflict
                ? getConflictHelperText(reservation, conflicts)
                : `Benötigt ${reservation.tableCount} Tisch${
                    reservation.tableCount === 1 ? '' : 'e'
                  }`
            }
            onChange={(event) => onChange(event.target.value)}
          />

          {isDirty && (
            <Tooltip title="Änderung zurücksetzen">
              <Button
                color="inherit"
                sx={{ minWidth: 48, height: 56 }}
                onClick={onReset}
              >
                <RestartAlt />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </Box>
  );
}

function getConflictHelperText(
  reservation: TableNumberReservation,
  conflicts: TableNumberConflict[],
): string {
  return conflicts
    .map((conflict) => {
      const otherNames = conflict.reservationIds
        .map((id, index) => ({
          id,
          name: conflict.reservationNames[index],
        }))
        .filter(({ id }) => id !== reservation.id)
        .map(({ name }) => name);

      const uniqueOtherNames = [...new Set(otherNames)];

      return `Tisch ${conflict.tableNumber} ist in ${
        conflict.timeslot
      } bereits für ${uniqueOtherNames.join(', ')} eingetragen.`;
    })
    .join(' ');
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Paper variant="outlined" className="p-4">
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Paper variant="outlined" className="p-10 text-center">
      <TableRestaurantOutlined color="disabled" sx={{ fontSize: 48 }} />
      <Typography className="mt-2" color="text.secondary">
        {text}
      </Typography>
    </Paper>
  );
}

function InfoItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-700">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function PaymentStatusChip({ status }: { status: ReservationPaymentStatus }) {
  if (status === ReservationPaymentStatus.PAID) {
    return <Chip size="small" color="success" label="Bezahlt" />;
  }

  if (status === ReservationPaymentStatus.PENDING_PAYMENT) {
    return <Chip size="small" color="warning" label="Zahlung offen" />;
  }

  return <Chip size="small" label={status} />;
}

function ReservationTypeChip({
  type,
}: {
  type: TableNumberReservation['type'];
}) {
  if (type === 'VIP') {
    return (
      <Chip
        size="small"
        label="VIP"
        variant="outlined"
        sx={{
          fontWeight: 700,
        }}
      />
    );
  }

  return (
    <Chip
      size="small"
      label="Stehtisch"
      variant="outlined"
      sx={{
        fontWeight: 700,
      }}
    />
  );
}

function buildDoubleSlotGroups(
  reservations: TableNumberReservation[],
): DoubleSlotGroup[] {
  const candidates = new Map<string, TableNumberReservation[]>();

  for (const reservation of reservations) {
    const key = [
      reservation.seating.eventDateId,
      normalizeIdentity(reservation.email),
      normalizeIdentity(reservation.name),
      reservation.type,
    ].join('|');

    const list = candidates.get(key) ?? [];
    list.push(reservation);
    candidates.set(key, list);
  }

  const groups: DoubleSlotGroup[] = [];

  for (const [key, candidateReservations] of candidates) {
    if (candidateReservations.length < 2) continue;

    const sortedReservations = [...candidateReservations].sort((a, b) => {
      const timeslotDifference =
        getTimeslotSortValue(a.seating.timeslot) -
        getTimeslotSortValue(b.seating.timeslot);

      if (timeslotDifference !== 0) {
        return timeslotDifference;
      }

      return a.id.localeCompare(b.id);
    });

    let chain: TableNumberReservation[] = [sortedReservations[0]];

    for (let index = 1; index < sortedReservations.length; index += 1) {
      const previous = chain[chain.length - 1];
      const current = sortedReservations[index];

      if (
        areConsecutiveTimeslots(
          previous.seating.timeslot,
          current.seating.timeslot,
        )
      ) {
        chain.push(current);
        continue;
      }

      if (chain.length > 1) {
        groups.push({
          id: `${key}|${chain.map(({ id }) => id).join('|')}`,
          reservations: chain,
        });
      }

      chain = [current];
    }

    // Letzte Kette nach der Schleife übernehmen
    if (chain.length > 1) {
      groups.push({
        id: `${key}|${chain.map(({ id }) => id).join('|')}`,
        reservations: chain,
      });
    }
  }

  return groups.sort(compareDoubleSlotGroups);
}

function compareDoubleSlotGroups(
  a: DoubleSlotGroup,
  b: DoubleSlotGroup,
): number {
  const firstA = a.reservations[0];
  const firstB = b.reservations[0];

  // 1. VIP vor Stehtisch
  const typeDifference =
    RESERVATION_TYPE_ORDER[firstA.type] - RESERVATION_TYPE_ORDER[firstB.type];

  if (typeDifference !== 0) {
    return typeDifference;
  }

  // 2. Früherer Start-Timeslot zuerst
  const timeslotDifference =
    getTimeslotSortValue(firstA.seating.timeslot) -
    getTimeslotSortValue(firstB.seating.timeslot);

  if (timeslotDifference !== 0) {
    return timeslotDifference;
  }

  // 3. Alphabetisch nach Name
  const nameDifference = firstA.name.localeCompare(firstB.name, 'de-DE', {
    sensitivity: 'base',
  });

  if (nameDifference !== 0) {
    return nameDifference;
  }

  // 4. Stabiler Fallback
  return a.id.localeCompare(b.id);
}

function areConsecutiveTimeslots(first: string, second: string) {
  const firstRange = parseTimeslot(first);
  const secondRange = parseTimeslot(second);

  if (!firstRange || !secondRange) return false;

  return firstRange.end % (24 * 60) === secondRange.start % (24 * 60);
}

function getTimeslotSortValue(timeslot: string) {
  const parsed = parseTimeslot(timeslot);
  if (!parsed) return Number.MAX_SAFE_INTEGER;

  // Slots nach Mitternacht gehören üblicherweise noch zum vorherigen Eventtag.
  return parsed.start < 6 * 60 ? parsed.start + 24 * 60 : parsed.start;
}

function parseTimeslot(timeslot: string) {
  const matches = [...timeslot.matchAll(/([01]?\d|2[0-3]):([0-5]\d)/g)];

  if (matches.length < 2) return null;

  const start = Number(matches[0][1]) * 60 + Number(matches[0][2]);
  let end = Number(matches[1][1]) * 60 + Number(matches[1][2]);

  if (end <= start) {
    end += 24 * 60;
  }

  return { start, end };
}

function parseGermanDate(value: string) {
  const [day, month, shortYear] = value.split('.').map(Number);

  if (!day || !month || Number.isNaN(shortYear)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const year = shortYear < 100 ? 2000 + shortYear : shortYear;
  return new Date(year, month - 1, day).getTime();
}

function normalizeIdentity(value: string) {
  return value.trim().toLocaleLowerCase('de-DE');
}

function normalizeTableNumber(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function hasOwn(object: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? 'Die Anfrage ist fehlgeschlagen.';
  }

  if (error instanceof Error) return error.message;
  return 'Ein unbekannter Fehler ist aufgetreten.';
}

function countUniqueTableNumberConflicts(
  conflictsByReservationId: Map<string, TableNumberConflict[]>,
): number {
  const uniqueConflicts = new Set<string>();

  for (const conflicts of conflictsByReservationId.values()) {
    for (const conflict of conflicts) {
      uniqueConflicts.add(
        `${conflict.timeslot}|${normalizeTableNumberKey(conflict.tableNumber)}`,
      );
    }
  }

  return uniqueConflicts.size;
}

function getGroupTableNumberConflicts(
  reservations: TableNumberReservation[],
  conflictsByReservationId: Map<string, TableNumberConflict[]>,
): TableNumberConflict[] {
  const uniqueConflicts = new Map<string, TableNumberConflict>();

  for (const reservation of reservations) {
    const conflicts = conflictsByReservationId.get(reservation.id) ?? [];

    for (const conflict of conflicts) {
      const key = `${conflict.timeslot}|${normalizeTableNumberKey(
        conflict.tableNumber,
      )}`;

      uniqueConflicts.set(key, conflict);
    }
  }

  return [...uniqueConflicts.values()].sort(compareTableNumberConflicts);
}

function getGroupConflictHelperText(
  reservations: TableNumberReservation[],
  conflicts: TableNumberConflict[],
): string {
  const groupReservationIds = new Set(
    reservations.map((reservation) => reservation.id),
  );

  return conflicts
    .map((conflict) => {
      const otherNames = conflict.reservationIds
        .map((id, index) => ({
          id,
          name: conflict.reservationNames[index],
        }))
        .filter(({ id }) => !groupReservationIds.has(id))
        .map(({ name }) => name);

      const uniqueOtherNames = [...new Set(otherNames)];

      if (uniqueOtherNames.length === 0) {
        return null;
      }

      return `Tisch ${conflict.tableNumber} ist in ${
        conflict.timeslot
      } bereits für ${uniqueOtherNames.join(', ')} eingetragen.`;
    })
    .filter((message): message is string => Boolean(message))
    .join(' ');
}

function compareTableNumberConflicts(
  a: TableNumberConflict,
  b: TableNumberConflict,
): number {
  const timeslotDifference =
    getTimeslotSortValue(a.timeslot) - getTimeslotSortValue(b.timeslot);

  if (timeslotDifference !== 0) {
    return timeslotDifference;
  }

  return a.tableNumber.localeCompare(b.tableNumber, 'de-DE', {
    numeric: true,
    sensitivity: 'base',
  });
}

function normalizeTableNumberKey(value: string): string {
  return value.toLocaleLowerCase('de-DE').replace(/\s+/g, '');
}

function parseTableNumbers(value: string): ParsedTableNumber[] {
  return value
    .split(/[,;+&/\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      key: normalizeTableNumberKey(label),
    }));
}

function buildTableNumberConflicts(
  reservations: TableNumberReservation[],
  getValue: (reservation: TableNumberReservation) => string,
): Map<string, TableNumberConflict[]> {
  const usage = new Map<
    string,
    {
      tableNumber: string;
      timeslot: string;
      reservations: Array<{
        id: string;
        name: string;
      }>;
    }
  >();

  for (const reservation of reservations) {
    const timeslot = reservation.seating.timeslot;
    const tableNumbers = parseTableNumbers(getValue(reservation));

    // Verhindert, dass beispielsweise "12, 12" dieselbe Reservierung
    // zweimal in den Usage-Eintrag schreibt.
    const uniqueTableNumbers = new Map(
      tableNumbers.map((tableNumber) => [tableNumber.key, tableNumber]),
    );

    for (const tableNumber of uniqueTableNumbers.values()) {
      const usageKey = `${timeslot}|${tableNumber.key}`;
      const existing = usage.get(usageKey);

      if (existing) {
        existing.reservations.push({
          id: reservation.id,
          name: reservation.name,
        });
      } else {
        usage.set(usageKey, {
          tableNumber: tableNumber.label,
          timeslot,
          reservations: [
            {
              id: reservation.id,
              name: reservation.name,
            },
          ],
        });
      }
    }
  }

  const conflictsByReservationId = new Map<string, TableNumberConflict[]>();

  for (const entry of usage.values()) {
    if (entry.reservations.length < 2) {
      continue;
    }

    const conflict: TableNumberConflict = {
      tableNumber: entry.tableNumber,
      timeslot: entry.timeslot,
      reservationIds: entry.reservations.map(({ id }) => id),
      reservationNames: entry.reservations.map(({ name }) => name),
    };

    for (const reservation of entry.reservations) {
      const conflicts = conflictsByReservationId.get(reservation.id) ?? [];

      conflicts.push(conflict);
      conflictsByReservationId.set(reservation.id, conflicts);
    }
  }

  for (const conflicts of conflictsByReservationId.values()) {
    conflicts.sort(compareTableNumberConflicts);
  }

  return conflictsByReservationId;
}
