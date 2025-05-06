import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Weinzelt - Datenschutz</title>
      </Head>
      <main className="max-w-xl mx-auto px-5 mb-5">
        <h1 className="text-2xl text-center mt-5">Datenschutzerklärung</h1>
        <div className="w-full border-t-[1px] border-gray-500 my-2"></div>
        <p className="font-bold">
          Allgemeiner Hinweis und Pflichtinformationen
        </p>
        <br />
        <p className="font-bold">Benennung der verantwortlichen Stelle</p>
        <br />
        <p>
          Die verantwortliche Stelle für die Datenverarbeitung auf dieser
          Website ist:
        </p>
        <br />
        <p>Weinzelt GmbH</p>
        <p>Sebastian Kreimeyer</p>
        <p>Heesenstraße 74</p>
        <p>40549 Düsseldorf</p>
        <br />
        <p>
          Die verantwortliche Stelle entscheidet allein oder gemeinsam mit
          anderen über die Zwecke und Mittel der Verarbeitung von
          personenbezogenen Daten (z.B. Namen, Kontaktdaten o. Ä.).
        </p>
        <br />
        <p className="font-bold">
          Widerruf Ihrer Einwilligung zur Datenverarbeitung
        </p>
        <br />
        <p>
          Nur mit Ihrer ausdrücklichen Einwilligung sind einige Vorgänge der
          Datenverarbeitung möglich. Ein Widerruf Ihrer bereits erteilten
          Einwilligung ist jederzeit möglich. Für den Widerruf genügt eine
          formlose Mitteilung per E-Mail. Die Rechtmäßigkeit der bis zum
          Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
        </p>
        <br />
        <p className="font-bold">
          Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde
        </p>
        <br />
        <p>
          Als Betroffener steht Ihnen im Falle eines datenschutzrechtlichen
          Verstoßes ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
          Zuständige Aufsichtsbehörde bezüglich datenschutzrechtlicher Fragen
          ist der Landesdatenschutzbeauftragte des Bundeslandes, in dem sich der
          Sitz unseres Unternehmens befindet. Der folgende Link stellt eine
          Liste der Datenschutzbeauftragten sowie deren Kontaktdaten bereit:
          <br />
          <a
            className="text-blue-600"
            href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html"
          >
            https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html
          </a>
          .
        </p>
        <br />
        <p className="font-bold">Recht auf Datenübertragbarkeit</p>
        <br />
        <p>
          Ihnen steht das Recht zu, Daten, die wir auf Grundlage Ihrer
          Einwilligung oder in Erfüllung eines Vertrags automatisiert
          verarbeiten, an sich oder an Dritte aushändigen zu lassen. Die
          Bereitstellung erfolgt in einem maschinenlesbaren Format. Sofern Sie
          die direkte Übertragung der Daten an einen anderen Verantwortlichen
          verlangen, erfolgt dies nur, soweit es technisch machbar ist.
        </p>
        <br />
        <p className="font-bold">
          Recht auf Auskunft, Berichtigung, Sperrung, Löschung
        </p>
        <br />
        <p>
          Sie haben jederzeit im Rahmen der geltenden gesetzlichen Bestimmungen
          das Recht auf unentgeltliche Auskunft über Ihre gespeicherten
          personenbezogenen Daten, Herkunft der Daten, deren Empfänger und den
          Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung,
          Sperrung oder Löschung dieser Daten. Diesbezüglich und auch zu
          weiteren Fragen zum Thema personenbezogene Daten können Sie sich
          jederzeit über die im Impressum aufgeführten Kontaktmöglichkeiten an
          uns wenden.
        </p>
        <br />
        <p className="font-bold">Kontaktformular</p>
        <br />
        <p>
          Per Kontaktformular übermittelte Daten werden einschließlich Ihrer
          Kontaktdaten gespeichert, um Ihre Anfrage bearbeiten zu können oder um
          für Anschlussfragen bereitzustehen. Eine Weitergabe dieser Daten
          findet ohne Ihre Einwilligung nicht statt.
        </p>
        <br />
        <p>
          Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt
          ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a
          DSGVO). Ein Widerruf Ihrer bereits erteilten Einwilligung ist
          jederzeit möglich. Für den Widerruf genügt eine formlose Mitteilung
          per E-Mail. Die Rechtmäßigkeit der bis zum Widerruf erfolgten
          Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt.
        </p>
        <br />
        <p>
          Über das Kontaktformular übermittelte Daten verbleiben bei uns, bis
          Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung
          widerrufen oder keine Notwendigkeit der Datenspeicherung mehr besteht.
          Zwingende gesetzliche Bestimmungen - insbesondere Aufbewahrungsfristen
          - bleiben unberührt.
        </p>
        <br />
        <p>
          Quelle: Datenschutz-Konfigurator von{' '}
          <a className="text-blue-600" href="mein-datenschutzbeauftragter.de">
            mein-datenschutzbeauftragter.de
          </a>
        </p>
      </main>
    </>
  );
}
