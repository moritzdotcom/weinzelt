import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/router';
import { ApiGetEventsResponse } from '../api/events';
import { ApiGetEventDataResponse } from '../api/events/[eventId]/data';
import { Session } from '@/hooks/useSession';
import axios from 'axios';
import { Refresh } from '@mui/icons-material';
import { ApiGetPageVisitsResponse } from '../api/pageVisits';
import { calculateMetrics, Metrics } from '@/lib/dashboard';

// ----- Typdefinitionen -----
interface PieData {
  name: string;
  value: number;
}
interface LineData {
  x: string;
  y: number;
}
interface TableData {
  [key: string]: string | number;
}

// Farbpalette für PieChart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

// ----- Komponenten -----

// Pie Chart Card
export const PieChartCard: React.FC<{ title: string; data: PieData[] }> = ({
  title,
  data,
}) => (
  <Card className="col-span-1">
    <CardHeader title={title} />
    <CardContent className="flex justify-center">
      <PieChart width={200} height={200}>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ReTooltip />
      </PieChart>
    </CardContent>
  </Card>
);

// Line Chart Card
export const LineChartCard: React.FC<{
  title: string;
  data: LineData[];
  yLabel?: string;
}> = ({ title, data, yLabel }) => (
  <div className="col-span-12 lg:col-span-6 rounded-lg bg-white pt-6 shadow-md">
    <h6 className="text-gray-600 text-center mb-5">{title}</h6>
    <ResponsiveContainer width="90%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          angle={-30}
          textAnchor="end"
          height={60}
          interval={0}
          tick={{ fontSize: 10 }}
        />
        <YAxis />
        <ReTooltip />
        <Line
          type="monotone"
          name={yLabel || 'Anzahl'}
          dataKey="y"
          stroke="#000000"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Number Chart Card
export const NumberChartCard: React.FC<{
  title: string;
  number: number;
  percentage?: number;
  type?: 'CURRENCY' | 'NUMBER';
}> = ({ title, number, type, percentage }) => (
  <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-lg bg-white shadow-md p-6 flex flex-col items-center justify-center gap-4">
    <h4 className="text-black text-3xl font-bold">
      {type == 'CURRENCY' ? `${number.toLocaleString('de-DE')} €` : number}
      {percentage !== undefined && (
        <span className="text-gray-400 text-sm ml-2">
          ({Math.round(percentage)}%)
        </span>
      )}
    </h4>
    <h6 className="text-gray-600 text-center">{title}</h6>
  </div>
);

// Table Chart Card
export const TableChartCard: React.FC<{ title: string; data: TableData[] }> = ({
  title,
  data,
}) => (
  <div className="col-span-12 rounded-lg bg-white shadow-md p-6">
    <h6 className="text-gray-600 text-center">{title}</h6>
    <div className="overflow-x-auto mt-4">
      <Box component="table" className="w-full text-left border-collapse">
        <Box component="thead">
          <Box component="tr">
            {Object.keys(data[0]).map((key) => (
              <Box
                component="th"
                key={key}
                className="px-4 py-2 border-b font-medium"
              >
                {key}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {data.map((row, i) => (
            <Box component="tr" key={i} className="hover:bg-gray-100">
              {Object.values(row).map((val, j) => (
                <Box component="td" key={j} className="px-4 py-2 border-b">
                  {val}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </div>
  </div>
);

// Dashboard Layout
export default function EventDashboard({ session }: { session: Session }) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiGetEventsResponse>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventData, setEventData] = useState<ApiGetEventDataResponse | null>(
    null
  );
  const [pageVisitData, setPageVisitData] =
    useState<ApiGetPageVisitsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const fetchData = async (eventId: string) => {
    setLoadingData(true);
    try {
      const eventResponse = await axios.get<ApiGetEventDataResponse>(
        `/api/events/${eventId}/data`
      );
      setEventData(eventResponse.data);
      const pageVisitResponse = await axios.get<ApiGetPageVisitsResponse>(
        `/api/pageVisits`
      );
      setPageVisitData(pageVisitResponse.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setEventData(null);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (session.status === 'unauthenticated') {
      router.push('/backend/login');
    }
  }, [session.status, router.isReady]);

  useEffect(() => {
    axios
      .get('/api/events')
      .then(({ data }: { data: ApiGetEventsResponse }) => {
        setEvents(data);
        const preselect = router.query.eventId as string;
        if (preselect) {
          setSelectedEventId(preselect);
        } else if (data.length == 1) {
          setSelectedEventId(data[0].id);
        }
      });
  }, [router.query.eventId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchData(selectedEventId);
    }
  }, [selectedEventId]);

  const metrics: Metrics | null = useMemo(() => {
    if (!eventData || !pageVisitData) return null;
    return calculateMetrics(eventData, pageVisitData);
  }, [eventData, pageVisitData]);

  return (
    <div className="px-6 py-16 bg-gray-50">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <div className="mt-6 flex items-center flex-col sm:flex-row justify-between gap-5">
        <TextField
          select
          label="Veranstaltung wählen"
          fullWidth
          sx={{ maxWidth: 'var(--container-md)', backgroundColor: 'white' }}
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>
        <button
          className="rounded-full bg-black text-white px-5 py-2 flex items-center gap-2 hover:bg-neutral-600 transition disabled:bg-neutral-500"
          onClick={() => fetchData(selectedEventId || '')}
          disabled={!selectedEventId || loadingData}
        >
          <Refresh />
          {loadingData ? 'Aktualisiert...' : 'Aktualisieren'}
        </button>
      </div>
      {metrics && eventData && pageVisitData && (
        <div className="grid grid-cols-12 gap-6 py-6">
          {/* Kennzahlen */}
          <NumberChartCard
            title="Reservierungsanfragen"
            number={metrics.totalCount}
          />
          <NumberChartCard title="VIP-Tische" number={metrics.vipCount} />
          <NumberChartCard title="Stehtische" number={metrics.standingCount} />
          <NumberChartCard
            title="Bestätigte Reservierungen"
            number={metrics.acceptedCount}
          />
          <NumberChartCard
            title="Bezahlte Reservierungen"
            number={metrics.paidCount}
            percentage={metrics.paidPercentage}
          />
          <NumberChartCard
            title="Umsatz durch Reservierungen"
            number={metrics.revenue}
            type="CURRENCY"
          />
          <NumberChartCard title="Seitenaufrufe" number={metrics.pageVisits} />
          <NumberChartCard
            title="Unique Visitors"
            number={metrics.uniqueVisitors}
          />
          {/* Diagramme */}
          <LineChartCard
            title="Reservierungsanfragen pro Tag"
            data={eventData.eventDates.map((date) => ({
              x: date.date,
              y: date.seatings.reduce(
                (acc, seating) => acc + seating.reservations.length,
                0
              ),
            }))}
            yLabel="Reservierungen"
          />
          <LineChartCard
            title="Reservierungsanfragen pro Package"
            data={metrics.packageCounts}
            yLabel="Reservierungen"
          />
          <LineChartCard
            title="Seitenaufrufe pro Tag"
            data={metrics.dailyPageVisitData}
            yLabel="Seitenaufrufe"
          />
          <LineChartCard
            title="Seitenaufrufe nach REF"
            data={metrics.pageVisitsBySource}
            yLabel="Seitenaufrufe"
          />
          <TableChartCard
            title="Neuste Reservierungen"
            data={metrics.lastTenReservations}
          />
        </div>
      )}
    </div>
  );
}
