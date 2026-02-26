import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Session } from '@/hooks/useSession';
import { team } from '@/lib/team';
import { Divider } from '@mui/material';
import Image from 'next/image';

export default function AboutPage({ session }: { session: Session }) {
  return (
    <div>
      <Navbar session={session} />
      <section className="bg-white pb-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center mt-12">
          {/* Überschrift */}
          <h1 className="text-3xl md:text-4xl font-cocogoose mb-8">
            Gastfreundschaft, die man schmeckt.
          </h1>

          {/* Teamfoto */}
          <div className="mb-8 sm:mb-12 text-left">
            <Image
              src="/team/team.jpg"
              alt="Unser Team"
              width={1200}
              height={600}
              className="rounded-2xl shadow-lg object-cover w-full h-auto"
            />
            <cite className="text-sm">&copy; 2026 Weinzelt GmbH</cite>
          </div>

          {/* Beschreibung */}
          <p className="text-lg md:text-xl leading-relaxed text-gray-800">
            Das Weinzelt auf der Rheinkirmes ist mehr als ein Ort zum Anstoßen -
            es ist ein Raum für besondere Begegnungen, für Lebensfreude im Glas
            und Leichtigkeit im Herzen. Hier treffen hochwertige Weine auf
            ausgelassene Stimmung, gute Musik auf echte Herzlichkeit. Was zählt,
            ist das Miteinander. Und genau das spürt man vom ersten Moment an.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            Im Mittelpunkt steht ein Team, das Gastfreundschaft nicht nur lebt,
            sondern liebt. Menschen, die wissen, wie man Atmosphäre schafft. Mit
            Charme, mit Gefühl - und einem feinen Gespür für Genuss. Von der Bar
            bis zur Tanzfläche ist alles darauf ausgerichtet, dass sich Gäste
            wohlfühlen, loslassen, feiern können. Ohne Stress, ohne
            Schnickschnack, aber mit Stil.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            Jedes Detail im Weinzelt ist bewusst gewählt: die Weinkarte
            kuratiert mit Geschmack, das Interior mit Liebe gestaltet, der Sound
            perfekt abgestimmt auf einen Abend, der sich anfühlen soll wie
            Sommer im Glas. Es geht nicht um laut - es geht um lebendig. Nicht
            um Masse - sondern um Klasse.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 mt-6">
            Das Weinzelt ist eine Einladung an alle, die gute Gesellschaft
            schätzen, den Moment feiern und das Besondere suchen. Ob früher
            Nachmittag oder später Höhepunkt der Nacht - hier ist jeder
            willkommen, der Wert auf Atmosphäre, Qualität und echten
            Kirmes-Charme legt.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-gray-800 my-6 font-bold">
            Wein verbindet. Das Weinzelt bringt zusammen.
          </p>
          <Divider />

          <section id="team" className="py-8 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                Unser Team
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map((member) => (
                  <div
                    key={member.name}
                    className="flex flex-col items-center text-center bg-gray-50 rounded-lg shadow-sm pb-4 transition hover:scale-105"
                  >
                    <div className="w-full mb-4 relative">
                      <img
                        src={member.imgSrc}
                        alt={member.name}
                        className="rounded-lg rounded-b-none object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 px-3">
                      {member.name}
                    </h3>
                    <p className="text-gray-600 text-sm px-3">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Divider />

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
