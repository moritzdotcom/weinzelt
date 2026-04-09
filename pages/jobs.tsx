import Footer from '@/components/footer';
import HtmlHead from '@/components/htmlHead';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';
import { TextField, Box, MenuItem } from '@mui/material';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function JobsPage({ session }: { session: Session }) {
  return (
    <div>
      <HtmlHead title="Weinzelt - Wir suchen dich!" />
      <Navbar session={session} />
      <section className="bg-white pb-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center mt-12">
          {/* Überschrift */}
          <h1 className="text-3xl md:text-4xl font-cocogoose mb-8">
            Werde Teil des Weinzelt Teams
          </h1>

          {/* Bild */}
          <div className="mb-12">
            <Image
              src={`/jobs.jpg`}
              alt="Weinzelt Team"
              width={800}
              height={400}
              className="rounded-2xl shadow-lg object-cover w-full h-auto max-w-2xl mx-auto"
            />
          </div>

          {/* Einleitungstext */}
          <p className="text-lg md:text-xl text-gray-800 mb-12 leading-relaxed">
            Du liebst Wein, gute Stimmung und arbeitest gerne mit Menschen? Dann
            bist du bei uns genau richtig! Das Weinzelt auf der Düsseldorfer
            Rheinkirmes ist ein neuer Treffpunkt für Genießer, Nachtschwärmer
            und Weinliebhaber - und du kannst ein Teil davon sein. Wir suchen
            motivierte Teamplayer, die in der Zeit vom{' '}
            <strong>17.07. bis 26.07.</strong> mindestens{' '}
            <strong>5 Tage verfügbar</strong> sind. Pünktlichkeit,
            Zuverlässigkeit und Eigeninitiative sind für dich
            selbstverständlich? Dann bewirb dich jetzt!
          </p>

          {/* Jobangebote */}
          <div className="grid md:grid-cols-2 gap-10 text-left">
            {/* VIP Kellner */}
            <div className="border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md hover:scale-105 transition">
              <h2 className="text-2xl font-cocogoose mb-4">
                ✨ VIP-Kellner:in
              </h2>
              <p className="text-gray-700 text-base leading-relaxed">
                Du hast jahrelange Erfahrung in der Gastronomie und verstehst
                etwas von Wein - wirklich etwas? In unserem exklusiven
                VIP-Bereich erwarten unsere Gäste nicht nur Top-Service, sondern
                auch fachkundige Empfehlungen. Du solltest souverän auftreten,
                belastbar sein und auch im größten Trubel den Überblick
                behalten. Sommelier-Kenntnisse oder tieferes Weinwissen sind ein
                großes Plus.
              </p>
            </div>

            {/* Barkraft */}
            <div className="border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md hover:scale-105 transition">
              <h2 className="text-2xl font-cocogoose mb-4">🍷 Barkraft</h2>
              <p className="text-gray-700 text-base leading-relaxed">
                Du hast bereits Erfahrung hinter der Bar und weißt, wie man mit
                Gästen umgeht? Dann suchen wir dich! An unserer Panorama-Bar
                servierst du hochwertige Weine, Aperitifs und Softdrinks mit
                Tempo, Charme und Überblick. Du bist schnell, freundlich und
                kannst auch unter Stress dein Team unterstützen - dann bist du
                bei uns genau richtig.
              </p>
            </div>

            {/* Küchen-/Spülhilfe */}
            <div className="border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md hover:scale-105 transition">
              <h2 className="text-2xl font-cocogoose mb-4">
                🍽️ Küchen- & Spülhilfe
              </h2>
              <p className="text-gray-700 text-base leading-relaxed">
                Ordnung in der Küche ist für dich selbstverständlich? Dann
                unterstütze unser Team im Hintergrund - beim Spülen, Vorbereiten
                und Sauberhalten unseres Küchenbereichs. Auch ohne
                Gastroerfahrung bist du willkommen, wenn du ordentlich, flink
                und zuverlässig bist.
              </p>
            </div>

            {/* Runner */}
            <div className="border border-gray-200 rounded-2xl p-6 shadow hover:shadow-md hover:scale-105 transition">
              <h2 className="text-2xl font-cocogoose mb-4">🏃‍♂️ Runner</h2>
              <p className="text-gray-700 text-base leading-relaxed">
                Als Runner bist du das Rückgrat unseres Betriebs: Du sorgst
                dafür, dass Kühlschränke immer aufgefüllt sind, Materialien aus
                dem Kühlcontainer kommen und das Team nie auf Nachschub warten
                muss. Eine körperlich fitte, zuverlässige Person mit Überblick
                ist hier gefragt.
              </p>
            </div>
          </div>
          <ApplicationForm />

          <div className="mt-16 text-center">
            <p className="text-lg text-gray-800 mb-4">
              Selbstverständlich kannst du dich auch per
              <Link
                href="https://www.instagram.com/weinzelt.dus/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 mx-1"
              >
                Instagram
              </Link>
              oder per
              <a
                href="mailto:jobs@dasweinzelt.de"
                className="underline underline-offset-2 mx-1"
              >
                Mail
              </a>
              bei uns bewerben - wir freuen uns auf dich!
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function ApplicationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/jobApplication', {
        name,
        email,
        availability,
        selectedJob,
      });
      setSuccess(true);

      setName('');
      setEmail('');
      setAvailability('');
      setSelectedJob('');

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {}
    setLoading(false);
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-6 shadow mt-12">
      <h2 className="text-2xl font-cocogoose mb-4 text-left">Jetzt bewerben</h2>
      <form className="space-y-6">
        {/* Name */}
        <TextField
          label="Name"
          variant="outlined"
          autoComplete="name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        {/* Email */}
        <TextField
          label="E-Mail"
          variant="outlined"
          type="email"
          autoComplete="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        <TextField
          select
          label="Aufgabenbereich wählen"
          fullWidth
          required
          value={selectedJob}
          onChange={(e) => {
            setSelectedJob(e.target.value);
          }}
          sx={{ marginBottom: 2, textAlign: 'start' }}
        >
          <MenuItem value={'VIP-Kellner:in'}>✨ VIP-Kellner:in</MenuItem>
          <MenuItem value={'Barkraft'}>🍷 Barkraft</MenuItem>
          <MenuItem value={'Küchen- & Spülhilfe'}>
            🍽️ Küchen- & Spülhilfe
          </MenuItem>
          <MenuItem value={'Runner'}>🏃‍♂️ Runner</MenuItem>
        </TextField>

        {/* Availability */}
        <TextField
          label="Verfügbarkeit im Zeitraum vom 17.07. bis 26.07."
          variant="outlined"
          fullWidth
          required
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder="z.B. 5 Tage"
          sx={{ marginBottom: 2 }}
        />

        {/* Submit Button */}
        <Box display="flex" justifyContent="center">
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !name.trim() ||
              !email.trim() ||
              !availability.trim() ||
              !selectedJob.trim()
            }
            className={`rounded mt-3 text-white px-3 py-2 disabled:opacity-60 ${
              success ? 'bg-green-600' : 'bg-black'
            }`}
          >
            {loading
              ? 'Wird gesendet...'
              : success
                ? 'Bewerbung gesendet'
                : 'Bewerbung absenden'}
          </button>
        </Box>
      </form>
    </div>
  );
}
