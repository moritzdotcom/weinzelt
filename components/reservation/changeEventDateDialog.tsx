import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  CalendarMonth,
  CheckCircle,
  EventBusy,
  TableRestaurant,
} from '@mui/icons-material';
import { ReservationPaymentStatus, ReservationType } from '@prisma/client';
import { ApiGetEventDataResponse } from '@/pages/api/events/[eventId]/data';
import { ApiPutReservationResponse } from '@/pages/api/reservations/[reservationId]';

type ChangeReservationDateDialogProps = {
  open: boolean;
  onClose: () => void;

  eventId: string;
  reservationId: string;
  seatingId: string;
  reservationType: ReservationType;
  reservationPaymentStatus: ReservationPaymentStatus;
  reservationMinimumSpend: number;
  tableCount: number;

  onChanged?: (updated: ApiPutReservationResponse) => void;
};

type SeatingOption = {
  seatingId: string;
  eventDateId: string;
  date: string;
  dow: string;
  timeslot: string;
  totalTables: number;
  reservedTables: number;
  freeTables: number;
  selectable: boolean;
  minimumSpend: number;
};

function getTotalTables({
  reservationType,
  seating,
}: {
  reservationType: ReservationType;
  seating: ApiGetEventDataResponse['eventDates'][number]['seatings'][number];
}) {
  return reservationType === 'VIP'
    ? seating.availableVip
    : seating.availableStanding;
}

function getSeatingOption({
  eventDate,
  seating,
  reservationId,
  reservationType,
  requiredTableCount,
}: {
  eventDate: ApiGetEventDataResponse['eventDates'][number];
  seating: ApiGetEventDataResponse['eventDates'][number]['seatings'][number];
  reservationId: string;
  reservationType: ReservationType;
  requiredTableCount: number;
}): SeatingOption {
  const totalTables = getTotalTables({
    reservationType,
    seating,
  });

  const reservedTables = seating.reservations
    /*
     * Die umzubuchende Reservierung darf nicht gegen sich selbst gerechnet
     * werden. Dadurch bleibt auch ihr bisheriges Seating korrekt auswählbar.
     */
    .filter(
      (reservation) =>
        reservation.id !== reservationId &&
        reservation.type === reservationType &&
        ['PAID', 'PENDING_PAYMENT'].includes(reservation.paymentStatus),
    )
    .reduce((sum, reservation) => sum + reservation.tableCount, 0);

  const freeTables = Math.max(totalTables - reservedTables, 0);

  return {
    seatingId: seating.id,
    eventDateId: eventDate.id,
    date: eventDate.date,
    dow: eventDate.dow,
    timeslot: seating.timeslot,
    totalTables,
    reservedTables,
    freeTables,
    selectable: freeTables >= requiredTableCount,
    minimumSpend:
      reservationType === 'VIP'
        ? seating.minimumSpendVip
        : seating.minimumSpendStanding,
  };
}

export function ChangeReservationDateDialog({
  open,
  onClose,
  eventId,
  reservationId,
  seatingId,
  reservationType,
  reservationPaymentStatus,
  reservationMinimumSpend,
  tableCount,
  onChanged,
}: ChangeReservationDateDialogProps) {
  const [eventDates, setEventDates] = useState<
    ApiGetEventDataResponse['eventDates']
  >([]);
  const [selectedSeatingId, setSelectedSeatingId] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !eventId) return;

    const abortController = new AbortController();

    async function loadEventDates() {
      try {
        setIsLoading(true);
        setError(null);
        setSelectedSeatingId(null);

        const response = await axios.get<ApiGetEventDataResponse>(
          `/api/events/${eventId}/data`,
          {
            signal: abortController.signal,
          },
        );

        setEventDates(response.data.eventDates);
      } catch (requestError) {
        if (axios.isCancel(requestError)) return;

        console.error(requestError);
        setError(
          'Die verfügbaren Veranstaltungstermine konnten nicht geladen werden.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEventDates();

    return () => {
      abortController.abort();
    };
  }, [eventId, open]);

  const groupedOptions = useMemo(() => {
    if (!eventDates) return [];
    return eventDates
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((eventDate) => ({
        eventDateId: eventDate.id,
        date: eventDate.date,
        dow: eventDate.dow,
        options: eventDate.seatings.map((seating) =>
          getSeatingOption({
            eventDate,
            seating,
            reservationId,
            reservationType,
            requiredTableCount: tableCount,
          }),
        ),
      }));
  }, [eventDates, reservationId, reservationType, tableCount]);

  const hasSelectableOption = useMemo(() => {
    return groupedOptions.some((group) =>
      group.options.some((option) => option.selectable),
    );
  }, [groupedOptions]);

  const handleClose = () => {
    if (isSaving) return;

    setSelectedSeatingId(null);
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    if (!selectedSeatingId) return;

    try {
      setIsSaving(true);
      setError(null);

      const { data } = await axios.put<ApiPutReservationResponse>(
        `/api/reservations/${reservationId}`,
        {
          seatingId: selectedSeatingId,
        },
      );

      onChanged?.(data);
      onClose();
    } catch (requestError) {
      console.error(requestError);
      setError('Die Reservierung konnte nicht umgebucht werden.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CalendarMonth color="primary" />

          <Box>
            <Typography variant="h6" fontWeight={700}>
              Reservierung umbuchen
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Wähle einen neuen Veranstaltungstermin aus.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">
            Für die Umbuchung {tableCount === 1 ? 'wird' : 'werden'}{' '}
            {tableCount} {tableCount === 1 ? 'freier Tisch' : 'freie Tische'} im{' '}
            <strong>{reservationType === 'VIP' ? 'VIP' : 'Stehplatz'}</strong>{' '}
            Bereich benötigt. Der Mindestverzehr i.H.v.{' '}
            {reservationMinimumSpend} €{' '}
            {reservationPaymentStatus == 'PAID'
              ? 'wurde bereits bezahlt'
              : 'wurde noch nicht bezahlt'}
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          {isLoading ? (
            <Stack spacing={1.5}>
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={132}
                  sx={{ borderRadius: 2.5 }}
                />
              ))}
            </Stack>
          ) : groupedOptions.length === 0 ? (
            <Alert severity="warning">
              Es wurden keine Veranstaltungstermine gefunden.
            </Alert>
          ) : (
            <Stack spacing={2.5}>
              {groupedOptions.map((group) => (
                <Stack key={group.eventDateId} spacing={1}>
                  <Box>
                    <Typography fontWeight={700}>
                      {group.dow}, {group.date}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Verfügbare Timeslots
                    </Typography>
                  </Box>

                  {group.options.length === 0 ? (
                    <Alert severity="warning" icon={false}>
                      Für diesen Tag wurden keine Timeslots angelegt.
                    </Alert>
                  ) : (
                    <Stack spacing={1}>
                      {group.options.map((option) => {
                        const isSelected =
                          option.seatingId === selectedSeatingId;
                        const isCurrent = seatingId == option.seatingId;

                        return (
                          <Card
                            key={option.seatingId}
                            variant="outlined"
                            sx={{
                              borderRadius: 2.5,
                              overflow: 'hidden',
                              borderColor: isSelected
                                ? 'primary.main'
                                : isCurrent
                                  ? 'success.main'
                                  : 'divider',
                              borderWidth: isSelected ? 2 : 1,
                              bgcolor: isSelected
                                ? 'action.selected'
                                : isCurrent
                                  ? '#c6f5c9'
                                  : option.selectable
                                    ? 'background.paper'
                                    : 'action.disabledBackground',
                              transition:
                                'border-color 150ms ease, background-color 150ms ease',
                            }}
                          >
                            <CardActionArea
                              disabled={
                                !option.selectable || isSaving || isCurrent
                              }
                              onClick={() =>
                                setSelectedSeatingId(option.seatingId)
                              }
                            >
                              <CardContent>
                                <Stack spacing={1.5}>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={1}
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      alignItems="center"
                                    >
                                      <AccessTime
                                        sx={{ fontSize: 19 }}
                                        color="action"
                                      />

                                      <Typography fontWeight={700}>
                                        {option.timeslot}
                                      </Typography>
                                    </Stack>

                                    {isSelected ? (
                                      <Chip
                                        size="small"
                                        color="primary"
                                        icon={<CheckCircle />}
                                        label="Ausgewählt"
                                      />
                                    ) : isCurrent ? (
                                      <Chip
                                        size="small"
                                        icon={<CheckCircle />}
                                        label="Aktueller Timeslot"
                                      />
                                    ) : option.selectable ? (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        label="Verfügbar"
                                      />
                                    ) : (
                                      <Chip
                                        size="small"
                                        icon={<EventBusy />}
                                        label="Nicht verfügbar"
                                      />
                                    )}
                                  </Stack>

                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={{ xs: 0.75, sm: 0 }}
                                    justifyContent={{
                                      xs: 'flex-start',
                                      sm: 'space-between',
                                    }}
                                  >
                                    <Stack
                                      direction={{ xs: 'column', sm: 'row' }}
                                      spacing={{ xs: 0.75, sm: 2 }}
                                    >
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        alignItems="center"
                                      >
                                        <TableRestaurant
                                          sx={{ fontSize: 18 }}
                                          color="action"
                                        />

                                        <Typography variant="body2">
                                          Insgesamt:{' '}
                                          <strong>
                                            {option.totalTables} Tische
                                          </strong>
                                        </Typography>
                                      </Stack>

                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Reserviert: {option.reservedTables}
                                      </Typography>

                                      <Typography
                                        variant="body2"
                                        color={
                                          option.selectable
                                            ? 'success.main'
                                            : 'error.main'
                                        }
                                        fontWeight={700}
                                      >
                                        Frei: {option.freeTables}
                                      </Typography>
                                    </Stack>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontWeight={600}
                                    >
                                      MVZ: {option.minimumSpend} €
                                    </Typography>
                                  </Stack>

                                  {!option.selectable && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Für diese Umbuchung fehlen{' '}
                                      {tableCount - option.freeTables}{' '}
                                      {tableCount - option.freeTables === 1
                                        ? 'freier Tisch'
                                        : 'freie Tische'}
                                      .
                                    </Typography>
                                  )}
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>
          )}

          {!isLoading && groupedOptions.length > 0 && !hasSelectableOption && (
            <Alert severity="warning">
              Aktuell gibt es keinen Timeslot mit ausreichend freien Tischen.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isSaving}>
          Abbrechen
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedSeatingId || isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isSaving ? 'Wird umgebucht …' : 'Reservierung umbuchen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
