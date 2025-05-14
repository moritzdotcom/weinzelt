import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';
import Image from 'next/image';

export default function AboutPage({ session }: { session: Session }) {
  return (
    <div>
      <Navbar session={session} />
      <section className="bg-white pb-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center mt-12">
          {/* Überschrift */}
          <h1 className="text-3xl md:text-4xl font-cocogoose mb-8">
            Das Team hinter dem Weinzelt
          </h1>

          {/* Teamfoto */}
          <div className="mb-8 sm:mb-12 text-left">
            <Image
              src="/team.jpg"
              alt="Unser Team"
              width={1200}
              height={600}
              className="rounded-2xl shadow-lg object-cover w-full h-auto"
            />
            <cite className="text-sm">&copy; 2025 Weinzelt GmbH</cite>
          </div>

          {/* Beschreibung */}
          <p className="text-lg md:text-xl leading-relaxed text-gray-800">
            Das <strong>Weinzelt</strong> ist nicht einfach nur ein neuer
            Treffpunkt auf der Rheinkirmes - es ist die geballte Expertise
            dreier Düsseldorfer Originale, die sich zusammengeschlossen haben,
            um ein einzigartiges Erlebnis zu schaffen. Hier trifft Wein auf
            Lebensfreude, Stil auf Substanz, Kirmes auf Carlsplatz-Flair.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            <strong>KM Entertainment</strong> - das Herz der Düsseldorfer
            Eventszene - steht hinter dem <em>Weindampfer</em> und{' '}
            <em>Weinufer</em>, zwei der beliebtesten Weinevents der Stadt. Ihre
            Leidenschaft für gute Musik, liebevolle Gastfreundschaft und
            detailverliebte Atmosphäre macht sie zum idealen Gastgeber auf der
            größten Kirmes am Rhein.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            <strong>Concept Riesling</strong> bringt das Beste aus den
            Weinbergen direkt vom Carlsplatz ins Zelt. Mit ihrem erlesenen
            Sortiment und ihrer Expertise als Sommeliers und Logistiker sorgen
            sie dafür, dass jeder Tropfen sitzt - von easy-drinking Rieslingen
            bis zu echten Raritäten. Qualität, Leidenschaft und Handwerk stehen
            hier an erster Stelle.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            <strong>Mr. Düsseldorf</strong>, das wohl bekannteste
            Lifestyle-Magazin der Stadt, sorgt für den richtigen Look & Feel.
            Mit Gespür für Ästhetik, starken Bildern und digitalem Know-how ist
            das Team rund um Mr. Düsseldorf verantwortlich für das Marketing,
            den Content und die Story des Weinzelt.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            Gemeinsam bilden wir ein Team aus echten Düsseldorfer
            Lifestyle-Experten - verbunden durch die Liebe zur Stadt, zum Wein
            und zu unvergesslichen Momenten. Willkommen im Weinzelt. Willkommen
            bei uns.
          </p>

          {/* Logos (optional) */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <img
              className="max-h-20 object-contain mx-auto"
              src="/partners/km-logo.png"
              alt="KM Entertainment"
            />
            <img
              className="max-h-20 object-contain mx-auto"
              src="/partners/cr-logo.webp"
              alt="Concept Riesling"
            />
            <img
              className="max-h-20 object-contain mx-auto"
              src="/partners/mrdus-logo.png"
              alt="Mr Düsseldorf"
            />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
