import { useEffect, useState } from 'react';

export default function CountdownSection() {
  const calculateTimeLeft = () => {
    const targetDate = new Date('2025-07-11T14:00:00'); // Startzeit Opening
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const formatUnit = (value: number, singular: string, plural: string) =>
    value === 1 ? singular : plural;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="countdown"
      className="py-20 bg-gradient-to-tr from-gray-100 to-blue-100 text-black text-center px-4"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        <img src="/logo.png" alt="Logo" className="w-80 h-auto mb-4" />
        <p className="text-xl md:text-2xl">
          Ab <b>11.07.2025</b> wird wieder eingeschenkt! Wein, Beats & beste
          Stimmung - <b>wir sehen uns im Weinzelt auf der Rheinkirmes!</b>
        </p>
        <p className="uppercase tracking-widest text-sm text-gray-700 mt-10">
          Noch
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
            <div className="text-4xl font-bold">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold mt-1">
              {formatUnit(timeLeft.days, 'Tag', 'Tage')}
            </div>
          </div>
          <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
            <div className="text-4xl font-bold">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold mt-1">
              {formatUnit(timeLeft.hours, 'Stunde', 'Stunden')}
            </div>
          </div>
          <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
            <div className="text-4xl font-bold">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold mt-1">
              {formatUnit(timeLeft.minutes, 'Minute', 'Minuten')}
            </div>
          </div>
          <div className="bg-gray-50 text-black rounded-xl px-6 py-4 shadow-lg">
            <div className="text-4xl font-bold">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold mt-1">
              {formatUnit(timeLeft.seconds, 'Sekunde', 'Sekunden')}
            </div>
          </div>
        </div>
        <p className="uppercase tracking-widest text-sm text-gray-700">
          bis zum Opening
        </p>
      </div>
    </section>
  );
}
