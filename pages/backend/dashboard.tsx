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
import { calculateMetrics, Metrics } from '@/lib/dashboard';
import EventSelector from '@/components/eventSelector';

// ----- Typdefinitionen -----
interface PieData {
  name: string;
  value: number;
}
interface LineData {
  x: string;
  y: number;
}
interface MultiLineData {
  x: string;
  y1: number;
  y2: number;
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

export const MultiLineChartCard: React.FC<{
  title: string;
  data: MultiLineData[];
  y1Label?: string;
  y2Label?: string;
  formatter?: (value: any, index: number) => string;
}> = ({ title, data, y1Label, y2Label, formatter }) => (
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
        <YAxis tickFormatter={formatter} />
        <ReTooltip formatter={formatter} />
        <Line
          type="monotone"
          name={y1Label || 'Anzahl'}
          dataKey="y1"
          stroke="#000000"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          name={y2Label || 'Anzahl'}
          dataKey="y2"
          stroke="#FF0000"
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
  const [selectedEvent, setSelectedEvent] =
    useState<ApiGetEventsResponse[number]>();
  const [eventData, setEventData] = useState<ApiGetEventDataResponse | null>(
    null,
  );
  const [loadingData, setLoadingData] = useState(false);

  const fetchData = async (eventId: string) => {
    setLoadingData(true);
    try {
      const eventResponse = await axios.get<ApiGetEventDataResponse>(
        `/api/events/${eventId}/data`,
      );
      setEventData(eventResponse.data);
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
    if (selectedEvent?.id) {
      fetchData(selectedEvent.id);
    }
  }, [selectedEvent?.id]);

  const metrics: Metrics | null = useMemo(() => {
    if (!eventData) return null;
    return calculateMetrics(eventData);
  }, [eventData]);

  return (
    <div className="px-6 py-16 bg-gray-50">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <div className="mt-6 flex items-center flex-col sm:flex-row justify-between gap-5">
        <EventSelector onChange={setSelectedEvent} />
        <button
          className="rounded-full bg-black text-white px-5 py-2 flex items-center gap-2 hover:bg-neutral-600 transition disabled:bg-neutral-500"
          onClick={() => fetchData(selectedEvent?.id || '')}
          disabled={!selectedEvent?.id || loadingData}
        >
          <Refresh />
          {loadingData ? 'Aktualisiert...' : 'Aktualisieren'}
        </button>
      </div>
      {metrics && eventData && (
        <div className="grid grid-cols-12 gap-6 py-6">
          {/* Kennzahlen */}
          <NumberChartCard title="Reservierungen" number={metrics.totalCount} />
          <NumberChartCard title="VIP-Tische" number={metrics.vipCount} />
          <NumberChartCard title="Stehtische" number={metrics.standingCount} />
          <NumberChartCard
            title="Umsatz durch Reservierungen"
            number={metrics.revenue}
            type="CURRENCY"
          />
          {/* Diagramme */}
          <LineChartCard
            title="Reservierungen pro Tag"
            data={eventData.eventDates.map((date) => ({
              x: date.date,
              y: date.seatings.reduce(
                (acc, seating) => acc + seating.reservations.length,
                0,
              ),
            }))}
            yLabel="Reservierungen"
          />
          <MultiLineChartCard
            title="Auslastung"
            data={metrics.capacity}
            formatter={(value: number) => `${Math.round(value)}%`}
            y1Label="VIP"
            y2Label="Stehtisch"
          />
          <LineChartCard
            title="VIP-Personen pro Tag"
            data={metrics.vipCountByDay}
            yLabel="Personen"
          />
          <LineChartCard
            title="Reservierungen pro Referral Code"
            data={metrics.referralCodes}
            yLabel="Reservierungen"
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
