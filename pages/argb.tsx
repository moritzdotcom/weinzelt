import { Box } from '@mui/material';

export default function ARGBPage() {
  return (
    <Box className="max-w-5xl mx-auto px-4 py-16 font-sans text-gray-900">
      <Box className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Weinzelt Logo"
          className="mx-auto h-16 mb-8"
        />
        <h1 className="text-3xl font-semibold">
          Allgemeine Reservierungs- und Geschäftsbedingungen Weinzelt GmbH -
          Rheinkirmes Düsseldorf 2026
        </h1>
      </Box>

      <div className="flex flex-col gap-3">
        <p>
          Die Weinzelt GmbH (nachfolgend „Weinzelt“) bietet Ihnen über das
          Online-Reservierungsformular unter https://dasweinzelt.de/reservation
          (nachfolgend „Reservierungsformular“) die Möglichkeit der Reservierung
          von Sitz- und/oder Stehplätzen sowie - je nach Reservierungspaket -
          den Erwerb von Verzehrmarken bzw. einer Verzehrkarte (nachfolgend
          zusammen „Reservierung“) für das Weinzelt während der Düsseldorfer
          Rheinkirmes 2026 im Zeitraum vom 17.07.2026 bis einschließlich
          26.07.2026 (nachfolgend „Veranstaltung“) in Düsseldorf.
        </p>

        <p>
          Diese Allgemeinen Reservierungs- und Geschäftsbedingungen (nachfolgend
          „ARGB“) gelten für alle über das Reservierungsformular (oder im
          Ausnahmefall per E-Mail) erfolgenden Reservierungen sowie für den
          Zutritt und Aufenthalt im Weinzelt.
        </p>

        <p>
          Soweit Bestätigungen von Kunden oder ähnliche Kommunikation des Kunden
          Hinweise auf eigene Geschäftsbedingungen enthalten (auch mit dem Ziel
          der Einbeziehung), wird einer solchen Einbeziehung hiermit
          ausdrücklich widersprochen. Diese ARGB gelten auch dann, wenn Weinzelt
          in Kenntnis entgegenstehender oder von diesen ARGB abweichender
          Bedingungen des Kunden Leistungen an den Kunden vorbehaltlos erbringt.
        </p>

        <h3 className="text-xl font-semibold mt-6">
          A) RESERVIERUNG / BEDINGUNGEN
        </h3>

        <div>
          <p className="text-stone-600 font-light">A.1</p>
          <p className="font-medium">Reservierungsweg / Reservierungsarten</p>
          <p>
            Reservierungsanfragen werden ausschließlich über das
            Reservierungsformular entgegengenommen und können nur darüber
            gebucht werden. In Ausnahmefällen können Reservierungsanfragen auch
            per E-Mail an reservierung@dasweinzelt.de gestellt werden.
          </p>
          <p>
            Im Weinzelt werden - je nach Angebot und Verfügbarkeit -
            insbesondere VIP-Tische (z. B. für 10 Personen) sowie
            Stehtische/Weinfässer angeboten. Soweit im Reservierungsformular
            nicht ausdrücklich abweichend ausgewiesen, werden insbesondere an
            Abenden und an stark frequentierten Tagen nur volle Tische bzw.
            Einheiten zu festen Zeiten vergeben.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.2</p>
          <p className="font-medium">
            Reservierungspakete / Verzehrkarte / Mindestverzehr
          </p>
          <p>
            Zur Buchungssicherheit und Planung können Reservierungen nur in den
            im Reservierungsformular angebotenen Zeiten gebucht werden. Art,
            Umfang und Preis des jeweiligen Pakets (einschließlich etwaiger
            Verzehrmarken/Verzehrkarte) ergeben sich verbindlich aus dem
            Reservierungsformular und der Reservierungsbestätigung.
          </p>
          <p>
            Verzehrmarken/Verzehrkarte gelten im Weinzelt wie Bargeld und können
            - sofern nicht anders ausgewiesen - für Speisen und Getränke
            eingelöst werden. Die Regelungen zur Gültigkeit und Ausschlussfrist
            nach Ziff. E) finden Anwendung.
          </p>
          <p>
            Ein nicht ausgeschöpftes Verzehrguthaben begründet keinen Anspruch
            auf Auszahlung oder Übertragung auf Folgejahre.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.3</p>
          <p className="font-medium">Verbindliches Angebot des Kunden</p>
          <p>
            Mit Bestätigung der Reservierungsanfrage durch den hierfür
            vorgesehenen Online-Befehl geben Sie ein verbindliches Angebot in
            Form der Reservierungsanfrage (Tag / Zeit / Personenzahl /
            Reservierungsbereich / Paket) ab und werden auf unsere Bezahlseite
            via STRIPE weitergeleitet. Sofern alle Daten richtig eingegeben
            wurden und der Bezahlprozess erfolgreich war, gilt das Angebot als
            angenommen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.4</p>
          <p className="font-medium">Reservierungsbestätigung</p>
          <p>
            Sofern die digitale Zahlung erfolgreich war, gilt die Reservierung
            mit der ausgestellten Rechnung als angenommen und verbindlich.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.5</p>
          <p className="font-medium">
            Rechnung / Zahlung / Zahlungsfrist / automatische Stornierung
          </p>
          <p>
            Die Reservierungsbestätigung erfolgt bei Zahlungseingang. Sofern die
            Reservierungsanfrage über die Weinzelt Website getätigt wird, wird
            direkt über den Zahlungsdienstleister STRIPE via Kreditkarte
            bezahlt. Sofern eine Reservierung über E-Mail stattfindet, versendet
            die Weinzelt GmbH eine Reservierungsbestätigung.
          </p>
          <p>
            Der Reservierungsbestätigung ist eine Rechnung mit spezifischer
            Rechnungsnummer (nachfolgend „Rechnungsnummer“) beigefügt. Der
            Rechnungsbetrag ist unter ausdrücklicher Angabe der Rechnungsnummer
            innerhalb der in der Rechnung genannten Zahlungsfrist - in der Regel
            innerhalb von 5 Tagen - zu begleichen. Maßgeblich für die
            fristgerechte Zahlung ist der Zahlungseingang bei Weinzelt unter
            Angabe der Rechnungsnummer.
          </p>
          <p>
            Im Falle einer Überschreitung der Zahlungsfrist oder im Falle einer
            Zahlung ohne Angabe der Rechnungsnummer erfolgt eine automatische
            Stornierung des Reservierungsvorgangs.
          </p>
          <p className="text-stone-700">
            Hinweis: Die Rechnung kann keinen Vorsteuerausweis enthalten. Dieser
            kann erst mit der Bewirtungsrechnung bei Erbringung der Leistung
            (Bewirtung zum Verzehr) erfolgen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.6</p>
          <p className="font-medium">Bank- und sonstige Gebühren</p>
          <p>
            Etwaige Bank- oder sonstige Gebühren (z. B. bei Auslandsüberweisung
            und/oder Scheck) trägt der Kunde. Der Kunde ist verpflichtet
            sicherzustellen, dass der bei Weinzelt letztlich eingehende Betrag
            den Rechnungsbetrag vollständig abdeckt.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.7</p>
          <p className="font-medium">
            Versand von Einlassbändern und Verzehrkarte / Versandkosten
          </p>
          <p>
            Nach Zahlungseingang werden Einlassbänder und
            Verzehrkarte/Verzehrmarken ca. 6 Wochen vor Veranstaltungsbeginn an
            die vom Kunden angegebene postalische Adresse versendet.
          </p>
          <p>
            Für den Versand wird eine Versandkostenpauschale in Höhe von 5,90
            EUR berechnet.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.8</p>
          <p className="font-medium">
            Änderungen von Reservierungs- oder Rechnungsdaten
          </p>
          <p>
            Bei nachträglichen Änderungen der Reservierungs- oder Rechnungsdaten
            nach Versand der Reservierungsbestätigung kann Weinzelt eine
            angemessene Bearbeitungs-/Aufwandspauschale berechnen. Etwaige
            Pauschalen werden dem Kunden vor Umsetzung der Änderung mitgeteilt.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.9</p>
          <p className="font-medium">
            Berechtigung zur Wahrnehmung der Reservierung / Identitätsnachweis
          </p>
          <p>
            Weinzelt möchte die Rechte aus der Reservierung (insbesondere
            Einlass, Zurverfügungstellung der reservierten Plätze, Nutzung der
            Verzehrkarte/Verzehrmarken) nur den Kunden gewähren, die die
            Reservierung gemäß Ziff. A.1 oder im Rahmen einer zulässigen
            Weitergabe nach Ziff. C.3 erworben haben.
          </p>
          <p>
            Weinzelt gewährt nur Kunden, die anhand von
            Individualisierungsmerkmalen der Reservierungsbestätigung (z. B.
            Name, Reservierungsnummer, Strich- und/oder QR-Code) identifizierbar
            sind, zusammen mit ihren Reservierungsgästen (in der reservierten
            Anzahl) in Verbindung mit der Reservierungsbestätigung und der
            entsprechenden Anzahl an Einlassbändern ein Recht auf Wahrnehmung
            der Reservierung.
          </p>
          <p>
            Zum Identitätsnachweis ist ein gültiges amtliches
            Identifikationsdokument (Personalausweis, Reisepass etc.)
            mitzuführen und auf Verlangen vorzuzeigen.
          </p>
          <p>
            Reservierungen, die auf von Weinzelt nicht autorisierten
            Verkaufsplattformen oder von sonstigen Dritten zum Verkauf angeboten
            werden, vermitteln kein Recht auf Wahrnehmung der Reservierung und
            können Rechtsfolgen nach Ziff. C.5 und H) auslösen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.10</p>
          <p className="font-medium">Stornierungsbedingungen</p>
          <p>
            Ein Rücktritt des Kunden von einer verbindlich gebuchten
            Reservierung ist grundsätzlich nur bis spätestens sechs (6) Wochen
            vor dem jeweiligen Reservierungstermin möglich.
          </p>
          <p>
            Maßgeblich für die Frist ist der Zeitpunkt des Zugangs der
            Rücktrittserklärung in Textform (z. B. per E-Mail) bei Weinzelt.
          </p>
          <p>
            Bei Gruppenbuchungen, insbesondere bei exklusiv gebuchten Bereichen
            oder gesperrten Teilflächen des Weinzelt, ist ein Rücktritt nur bis
            spätestens acht (8) Wochen vor dem jeweiligen Reservierungstermin
            möglich.
          </p>
          <p>
            Erfolgt die Buchung innerhalb von sechs (6) Wochen vor dem
            jeweiligen Reservierungstermin, ist eine Stornierung oder ein
            Rücktritt grundsätzlich ausgeschlossen.
          </p>
          <p>
            Nach Ablauf der vorgenannten Fristen besteht kein Anspruch auf
            Rückerstattung bereits geleisteter Zahlungen.
          </p>
          <p>
            Unabhängig davon kann der Kunde Weinzelt jederzeit kontaktieren.
            Weinzelt wird sich im Rahmen der betrieblichen Möglichkeiten um eine
            proaktive und einvernehmliche Lösung bemühen (z. B. Umbuchung oder
            Weitervermittlung), jedoch ohne rechtlichen Anspruch des Kunden
            hierauf.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.11</p>
          <p className="font-medium">
            Absage/Änderungen der Veranstaltung / behördliche Maßnahmen /
            Kapazitätsreduktion
          </p>
          <p>
            Im Zusammenhang mit dem Erwerb der Reservierungen kann es, z. B. bei
            einer öffentlichen Absage der Rheinkirmes, behördlichen Maßnahmen
            bis hin zur Reduzierung der zulässigen Gästeanzahl oder
            vergleichbaren Ereignissen, dazu kommen, dass eine Reservierung
            nicht (vollständig) wahrgenommen werden kann. Weinzelt ist in diesen
            Fällen berechtigt, die Vergabe der zu besetzenden Plätze mittels
            eines transparenten, diskriminierungsfreien Verfahrens nach vorher
            festgelegten Vorgaben zu bestimmen bzw. einzelne grundsätzlich
            erworbene Reservierungen im Einzelfall, in Teilen oder in Gänze zu
            stornieren. Eine solche Stornierung wird dem Kunden mitgeteilt oder
            allgemein bekanntgegeben.
          </p>
          <p>
            Weinzelt haftet außer im Fall von Vorsatz oder grober Fahrlässigkeit
            nicht für vergebliche Aufwendungen (z. B. Reise- und
            Übernachtungskosten).
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">A.12</p>
          <p className="font-medium">
            Rückerstattung bei Stornierung nach A.11
          </p>
          <p>
            Im Fall einer Stornierung nach Ziff. A.11 wird Weinzelt bereits
            erhaltene, den entsprechenden Reservierungszeitraum betreffende
            Zahlungen und Entgelte zurückerstatten. Eine Rückerstattung wird nur
            fällig, wenn der Kunde IBAN und ggf. BIC (nachfolgend „Bankdaten“)
            an Weinzelt übermittelt hat. Weinzelt kann den Kunden hierfür
            kontaktieren, möglichst per E-Mail.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6">
          B) PLATZIERUNG / KARENZZEIT
        </h3>

        <div>
          <p className="text-stone-600 font-light">B.1</p>
          <p className="font-medium">Platzierungswünsche</p>
          <p>
            Bei Reservierungen ist Weinzelt bemüht, Platzierungswünsche zu
            berücksichtigen. Bestimmte Tische oder Tischnummern können jedoch
            nicht garantiert werden. Box- und Tischnummern sind am Tage des
            Besuches unter dem Reservierungsnamen aus der jeweiligen
            Tagesreservierungsliste am Eingang zu entnehmen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">B.2</p>
          <p className="font-medium">Freigabe nach Ablauf</p>
          <p>
            Zeitlich begrenzte Reservierungen sind nach dem angegebenen
            Zeitpunkt unverzüglich freizugeben. Ein Verweilen in den Gängen nach
            dieser Zeit ist aus Sicherheitsgründen untersagt.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">B.3</p>
          <p className="font-medium">
            Karenzzeit / Weitervergabe bei Nichterscheinen / Verlassen
          </p>
          <p>
            Bei Nichterscheinen innerhalb von 30 Minuten entfällt der Anspruch
            auf die Plätze.
          </p>
          <p>
            Bei vollständiger Abwesenheit von dem zugewiesenen Tisch aller Gäste
            für mindestens 30 Minuten verfällt die Reservierung.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">B.4</p>
          <p className="font-medium">Zusammenplatzierung</p>
          <p>
            Weinzelt ist bei Einhaltung aller sonstigen öffentlichen Vorgaben,
            einschließlich Sicherheitsvorschriften, berechtigt, mehr als eine
            Reservierung zusammen an einem Tisch zu platzieren.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">B.5</p>
          <p className="font-medium">
            Keine zusätzlichen Stehplätze / Security
          </p>
          <p>
            Sitzplätze sind nur für die in der Reservierung vereinbarte
            Personenzahl reserviert. Zusätzliche Stehplätze im Bereich Ihrer
            Reservierung sind insbesondere aus feuerrechtlichen Gründen nicht
            gestattet. Der Einsatz von kundeneigenem Sicherheitspersonal ist nur
            nach rechtzeitiger Absprache mit der Geschäftsleitung im Vorfeld des
            Besuches möglich; rechtzeitig ist nur, wenn die Absprache mindestens
            7 Kalendertage im Voraus erfolgt.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6">C) NUTZUNG / WEITERGABE</h3>

        <div>
          <p className="text-stone-600 font-light">C.1</p>
          <p className="font-medium">Zweck der Beschränkung</p>
          <p>
            Zur Vermeidung von Gewalt- und Straftaten, zur Unterbindung der
            nicht autorisierten Weitergabe von Reservierungen, zur Vermeidung
            von Spekulationen mit Reservierungen und zur Erhaltung eines
            sozialen Preisgefüges liegt es im Interesse von Weinzelt und der
            Kunden, eine Weitergabe von Reservierungen einzuschränken.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">C.2</p>
          <p className="font-medium">Unzulässige Weitergabe</p>
          <p>
            Jeglicher unzulässige gewerbliche oder kommerzielle Weiterverkauf
            oder eine sonstige unzulässige Weitergabe einer Reservierung ist
            untersagt. Unzulässig ist insbesondere:
          </p>
          <p>
            a) Reservierungen öffentlich, bei Auktionen oder im Internet (z. B.
            eBay, Kleinanzeigen, Facebook) oder auf nicht von Weinzelt
            autorisierten Plattformen zum Kauf anzubieten und/oder zu veräußern;
          </p>
          <p>
            b) Reservierungen zu einem höheren als dem entrichteten Preis
            weiterzugeben (ein Preisaufschlag von bis zu 10 % zum Ausgleich
            entstandener Transaktionskosten ist zulässig);
          </p>
          <p>
            c) Reservierungen regelmäßig und/oder in größerer Anzahl
            weiterzugeben;
          </p>
          <p>
            d) Reservierungen an gewerbliche und/oder kommerzielle
            Wiederverkäufer anzubieten, zu veräußern oder weiterzugeben;
          </p>
          <p>
            e) Reservierungen ohne ausdrückliche vorherige Zustimmung (Textform
            ausreichend) kommerziell oder gewerblich zu nutzen oder nutzen zu
            lassen (z. B. Werbung, Vermarktung, Bonus, Gewinn,
            Hospitality-/Reisepaket).
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">C.3</p>
          <p className="font-medium">Zulässige private Weitergabe</p>
          <p>
            Eine private Weitergabe einer Reservierung aus nicht kommerziellen
            bzw. gewerblichen Gründen, insbesondere in Einzelfällen bei
            Krankheit des Kunden oder Vergleichbarem, ist zulässig, wenn kein
            Fall der unzulässigen Weitergabe vorliegt und
          </p>
          <p>
            a) der Kunde Weinzelt in Textform rechtzeitig über die Weitergabe
            informiert sowie
          </p>
          <p>
            b) der neue Reservierungshalter den Inhalt dieser ARGB anerkennt und
            deren Geltung zustimmt (Textform ausreichend).
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">C.4</p>
          <p className="font-medium">Datenverarbeitung</p>
          <p>
            Die Verarbeitung des Namens des neuen Reservierungshalters erfolgt
            zur Erfüllung der Verträge gemäß Art. 6 Abs. 1 lit. b DSGVO sowie
            zur Wahrung der berechtigten Interessen von Weinzelt gemäß Art. 6
            Abs. 1 lit. f DSGVO. Die berechtigten Interessen ergeben sich aus
            Ziff. C.1.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">C.5</p>
          <p className="font-medium">Maßnahmen bei Verstößen</p>
          <p>
            Im Fall eines oder mehrerer Verstöße gegen Ziff. C.2 und/oder sonst
            unzulässiger Weitergabe von Reservierungen ist Weinzelt berechtigt:
          </p>
          <p>
            a) Reservierungen und/oder Einlassbänder/Verzehrkarten nicht zu
            liefern bzw. zu stornieren;
          </p>
          <p>
            b) Reservierungen zu sperren und die Wahrnehmung der Rechte aus der
            Reservierung zu verweigern bzw. den Reservierungshalter aus dem
            Weinzelt zu verweisen, jeweils entschädigungslos;
          </p>
          <p>
            c) Kunden für einen angemessenen Zeitraum, maximal jedoch fünf (5)
            nachfolgende Veranstaltungen, vom Besuch und Reservierungserwerb
            auszuschließen;
          </p>
          <p>d) die Auszahlung des Mehrerlöses bzw. Gewinns zu verlangen;</p>
          <p>
            e) in angemessener Weise über den Vorfall zu berichten, um eine
            vertragswidrige Nutzung der Reservierungen in Zukunft zu verhindern.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6">
          D) EINLASS / FESTZELTBETRIEB
        </h3>

        <div>
          <p className="text-stone-600 font-light">D.1</p>
          <p className="font-medium">Einlass / Hausrecht</p>
          <p>
            Der Einlass in das Weinzelt ist für den Reservierungshalter/Kunden
            und dessen Reservierungsgäste nur mit Reservierungsbestätigung und
            Einlassband zu dem Reservierungstermin vorbehaltlich der
            Bestimmungen dieser ARGB gewährleistet. Weinzelt behält sich vor,
            vom Hausrecht Gebrauch zu machen und Personen, die die
            Aufrechterhaltung der Ordnung gefährden, den Zutritt zu verwehren
            oder aus dem Weinzelt zu verweisen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.2</p>
          <p className="font-medium">Sicherheitskontrollen</p>
          <p>
            Weinzelt ist berechtigt, im Rahmen der Einlasskontrolle sowie
            während der Veranstaltung angemessene Sicherheits- und
            Taschenkontrollen durchzuführen. Der Zutritt kann insbesondere
            verweigert werden, wenn Gäste die Durchführung von
            Sicherheitskontrollen ablehnen oder verbotene Gegenstände mitführen.
          </p>
          <p>
            Verboten sind insbesondere Waffen, gefährliche Gegenstände,
            pyrotechnische Gegenstände, Glasbehälter, eigene Getränke oder
            Speisen sowie sonstige Gegenstände, die die Sicherheit oder den
            ordnungsgemäßen Ablauf der Veranstaltung gefährden können.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.3</p>
          <p className="font-medium">Weinzelt-Guide / Hausordnung</p>
          <p>
            Der Zutritt und Aufenthalt unterliegen dem dort ausgehängten und
            online einsehbaren „Weinzelt Guide“ unter
            https://dasweinzelt.de/argb bzw. dem jeweils dort verlinkten Guide.
            Mit Zutritt erkennt jeder Gast den Weinzelt Guide als verbindlich
            an. Der Weinzelt Guide gilt unabhängig von der Wirksamkeit dieser
            ARGB.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.4</p>
          <p className="font-medium">Foto- und Videoaufnahmen</p>
          <p>
            Während der Veranstaltung werden Foto- und Videoaufnahmen erstellt.
            Weinzelt kann diese für Berichterstattung, Social Media und weitere
            Unternehmenszwecke nutzen. Wenn Sie nicht fotografiert/gefilmt
            werden möchten, informieren Sie bitte das Veranstaltungsteam vor
            Ort.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.5</p>
          <p className="font-medium">
            Zusätzliche Anforderungen (z. B. behördliche Auflagen)
          </p>
          <p>
            Der Kunde erkennt an, dass aus wichtigem Grund, insbesondere
            aufgrund gesetzlich und/oder behördlich vorgegebener Weisungen bzw.
            Anordnungen, zusätzliche Regelungen, Bestimmungen und Anforderungen
            für Zutritt und Aufenthalt gelten können. Diese werden rechtzeitig
            bekanntgegeben und sind ab Bekanntgabe zwingend zu beachten.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.6</p>
          <p className="font-medium">
            Rücktritt/Erstattung in besonderen Fällen
          </p>
          <p>
            Soweit ein Rücktritt des Kunden aus von Weinzelt bekanntgegebenen
            zwingenden Zutrittsvoraussetzungen im Einzelfall zulässig ist,
            erstattet Weinzelt erhaltene Zahlungen abzüglich ggf. angefallener
            Aufwandspauschalen. Im Übrigen gelten Ziff. A.10 und A.11
            entsprechend.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.7</p>
          <p className="font-medium">Foto- und Filmaufnahmen durch Gäste</p>
          <p>
            Foto-, Film- oder Tonaufnahmen durch Gäste sind ausschließlich für
            den privaten Gebrauch gestattet. Jegliche gewerbliche oder
            kommerzielle Nutzung sowie die Veröffentlichung zu Werbe- oder
            Vermarktungszwecken bedarf der vorherigen ausdrücklichen Zustimmung
            von Weinzelt.
          </p>
          <p>
            Weinzelt ist berechtigt, im Einzelfall die Unterlassung von
            Aufnahmen zu verlangen, sofern hierdurch der Veranstaltungsbetrieb,
            Rechte Dritter oder berechtigte Interessen von Weinzelt
            beeinträchtigt werden.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.8</p>
          <p className="font-medium">
            Rauch- und Nichtraucherschutz / Cannabis
          </p>
          <p>
            Es gelten die gesetzlichen Bestimmungen des Nichtraucherschutzes in
            Nordrhein-Westfalen in der jeweils gültigen Fassung. Das Rauchen ist
            nur in den hierfür ausgewiesenen Bereichen gestattet.
          </p>
          <p>
            Der Konsum von Cannabis sowie sonstiger berauschender Substanzen ist
            im gesamten Weinzeltbereich untersagt. Bei Verstößen ist Weinzelt
            berechtigt, vom Hausrecht Gebrauch zu machen und Gäste des
            Weinzeltbereichs zu verweisen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">D.9</p>
          <p className="font-medium">Jugendschutz</p>
          <p>
            Es gelten die Bestimmungen des Jugendschutzgesetzes (JuSchG) in der
            jeweils gültigen Fassung. Der Zutritt zum Weinzelt ist Jugendlichen
            unter 16 Jahren nur in Begleitung einer personensorgeberechtigten
            oder erziehungsbeauftragten Person gestattet.
          </p>
          <p>
            Jugendlichen unter 18 Jahren ist der Aufenthalt im Weinzelt nach
            24:00 Uhr nicht gestattet, sofern keine personensorgeberechtigte
            oder erziehungsbeauftragte Person anwesend ist.
          </p>
          <p>
            Die Abgabe und der Konsum von alkoholischen Getränken richten sich
            nach den gesetzlichen Bestimmungen des Jugendschutzgesetzes.
            Insbesondere werden branntweinhaltige Getränke an Personen unter 18
            Jahren nicht abgegeben.
          </p>
          <p>
            Weinzelt ist berechtigt, im Rahmen der Einlasskontrolle oder im
            laufenden Betrieb Altersnachweise zu verlangen. Ein gültiger
            amtlicher Lichtbildausweis ist auf Verlangen vorzuzeigen.
          </p>
          <p>
            Bei Verstößen gegen jugendschutzrechtliche Vorschriften ist Weinzelt
            berechtigt, den Zutritt zu verweigern oder Personen des
            Weinzeltbereichs zu verweisen.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6">
          E) GÜLTIGKEIT UND AUSSCHLUSSFRIST VERZEHRMARKEN/VERZEHRKARTE
        </h3>
        <p>
          Verzehrmarken bzw. die Verzehrkarte sind jeweils nur für die Dauer der
          Veranstaltung vom 17.07.2026 bis einschließlich 26.07.2026 im Weinzelt
          einlösbar.
        </p>
        <p>
          Die Verzehrmarken behalten innerhalb der Zeit der Rheinkirmes ihre
          Gültigkeit, jedoch ohne Anspruch auf den reservierten Platz,
          insbesondere dann, wenn der Platz/Tisch nach Maßgabe der
          Karenzzeitregelung (Ziff. B.3) weitervergeben wurde.
        </p>
        <p>
          Eine Rückgabe der Verzehrmarken/Verzehrkarte ist nicht möglich; eine
          Erstattung von Restbeträgen oder nicht eingelösten Verzehrmarken ist
          ausgeschlossen.
        </p>

        <h3 className="text-xl font-semibold mt-6">F) ZAHLUNGSBEDINGUNGEN</h3>
        <p>
          Die sich aus dem tatsächlichen Verzehr ergebende Bewirtungsrechnung
          ist vor Verlassen des Weinzeltbereichs sofort zur Zahlung fällig. Der
          Rechnungsbetrag kann durch Verzehrmarken/Verzehrkarte, Bargeld sowie -
          sofern vor Ort angeboten - durch Karte beglichen werden. Etwaige
          Einwände gegen den Rechnungsinhalt sind unmittelbar vor Bezahlung beim
          zuständigen Servicemitarbeiter bzw. der Geschäftsleitung vorzubringen.
          Spätere Reklamationen können nicht mehr berücksichtigt werden.
        </p>

        <h3 className="text-xl font-semibold mt-6">
          G) VERTRAGSSTRAFE / MEHRERLÖS
        </h3>
        <p>
          Im Fall eines schuldhaften Verstoßes des Kunden gegen diese ARGB,
          insbesondere gegen eine oder mehrere Regelungen in Ziff. C.2, ist
          Weinzelt ergänzend zu den sonstigen gesetzlichen oder nach diesen ARGB
          möglichen Maßnahmen und unbeschadet darüberhinausgehender
          Schadensersatzansprüche berechtigt, eine angemessene Vertragsstrafe in
          Höhe von bis zu 2.500,00 EUR gegen den Kunden zu verhängen.
        </p>
        <p>
          Maßgeblich für die Höhe der Vertragsstrafe sind insbesondere die
          Anzahl und Intensität der Verstöße, Art und Grad des Verschuldens
          (Vorsatz/Fahrlässigkeit), etwaige Wiederholung sowie durch die
          Weitergabe erzielte Erlöse.
        </p>
        <p>
          Im Fall einer unzulässigen Weitergabe von Reservierungen gemäß Ziff.
          C.2 a) und/oder C.2 b) ist Weinzelt zusätzlich berechtigt, sich von
          dem Kunden dessen bei der unzulässigen Weitergabe erzielten Mehrerlös
          bzw. Gewinn ganz oder teilweise auszahlen zu lassen. Erhaltene
          Vertragsstrafenzahlungen sind auf einen sich aus demselben Sachverhalt
          ergebenden Schadensersatzanspruch anzurechnen.
        </p>

        <h3 className="text-xl font-semibold mt-6">
          H) HAFTUNG UND SCHLUSSBESTIMMUNGEN
        </h3>

        <div>
          <p className="text-stone-600 font-light">H.1</p>
          <p className="font-medium">Bestimmungen</p>
          <p>
            Der Aufenthalt im Bereich um das Weinzelt und im Weinzelt erfolgt
            auf eigene Gefahr. Weinzelt, seine gesetzlichen Vertreter und/oder
            Erfüllungsgehilfen haften auf Schadensersatz - gleich aus welchem
            Rechtsgrund - nur bei Vorsatz oder grober Fahrlässigkeit oder (dann
            begrenzt auf den zum Zeitpunkt des Vertragsschlusses vorhersehbaren,
            vertragstypischen Schaden) bei Verletzung wesentlicher
            Vertragspflichten.
          </p>
          <p>
            Vertragswesentliche Pflichten sind solche, deren Erfüllung die
            ordnungsgemäße Vertragsdurchführung erst ermöglichen, deren
            Verletzung die Erreichung des Vertragszwecks gefährden und auf deren
            Einhaltung der Kunde regelmäßig vertraut.
          </p>
          <p>
            Die Haftungsbegrenzungen gelten nicht bei Schäden aus der Verletzung
            des Lebens, des Körpers oder der Gesundheit oder bei sonstigen
            gesetzlich zwingenden Haftungstatbeständen.
          </p>
          <p>
            Es gilt ausschließlich das Recht der Bundesrepublik Deutschland
            unter Ausschluss des UN-Kaufrechts (CISG). Erfüllungs- und
            Zahlungsort ist Düsseldorf. Ausschließlicher Gerichtsstand ist -
            soweit zulässig - Düsseldorf.
          </p>
          <p>
            Sollten einzelne Klauseln dieser ARGB ganz oder teilweise unwirksam
            sein, berührt dies die Wirksamkeit der übrigen Klauseln nicht.
            Weinzelt ist bei einer Veränderung der Marktverhältnisse und/oder
            der Gesetzeslage und/oder der höchstrichterlichen Rechtsprechung
            berechtigt, diese ARGB mit einer Ankündigungsfrist von vier (4)
            Wochen im Voraus zu ergänzen und/oder zu ändern, sofern die Änderung
            für den Kunden zumutbar ist. Änderungen gelten als genehmigt, wenn
            der Kunde nicht innerhalb von vier (4) Wochen nach Zugang
            widerspricht, vorausgesetzt Weinzelt hat auf die Genehmigungsfiktion
            ausdrücklich hingewiesen.
          </p>
        </div>

        <div>
          <p className="text-stone-600 font-light">H.2</p>
          <p className="font-medium">
            Haftung für Garderobe und persönliche Gegenstände
          </p>
          <p>
            Eine Haftung von Weinzelt für den Verlust, Diebstahl oder die
            Beschädigung von Garderobe oder sonstigen persönlichen Gegenständen
            der Gäste ist - außer bei Vorsatz oder grober Fahrlässigkeit -
            ausgeschlossen.
          </p>
          <p>
            Dies gilt auch für in das Weinzelt mitgebrachte Wertgegenstände,
            Taschen, technische Geräte oder sonstige Gegenstände.
          </p>
          <p>
            Eine Haftung für Garderobe besteht nur dann, wenn diese gegen
            gesondertes Entgelt ausdrücklich zur Verwahrung übernommen wurde.
          </p>
          <p>
            Unabhängig von den gesetzlichen Bestimmungen behält sich Weinzelt
            vor, strengere Altersbeschränkungen für einzelne Veranstaltungstage
            oder Zeiträume festzulegen.
          </p>
        </div>

        <h3 className="text-xl font-semibold mt-6">Datenschutz</h3>
        <p>
          Informationen zur Verarbeitung personenbezogener Daten im Zusammenhang
          mit der Reservierung und dem Besuch des Weinzelt finden sich in der
          Datenschutzerklärung der Weinzelt GmbH unter:
          https://dasweinzelt.de/datenschutz
        </p>
        <p>
          Diese ist Bestandteil des Online-Reservierungsprozesses und jederzeit
          abrufbar.
        </p>

        <h3 className="text-xl font-semibold mt-6">Kontaktdaten</h3>
        <p>Weinzelt GmbH</p>
        <p>Heesenstraße 74, Halle 7f</p>
        <p>40549 Düsseldorf</p>
        <p>Telefon: 0211 93679940</p>
        <p>E-Mail Reservierung: reservierung@dasweinzelt.de</p>
        <p>Allgemeine E-Mail: info@dasweinzelt.de</p>
      </div>
    </Box>
  );
}
