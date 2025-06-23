import { sendMail } from '@/lib/mailer';

export default function sendReservationMail(
  email: string,
  name: string,
  people: string,
  date: string,
  timeslot: string,
  price: number,
  packageName: string,
  packageDescription: string
) {
  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Deine Reservierung wurde bestätigt',
    text: `Hallo ${name},\n\ndeine Reservierung für ${people} Pers. am ${date} für den Zeitraum ${timeslot} ist bestätigt!\nBitte überweise ${price} € im Voraus auf das unten stehende Konto. Bei Nichtzahlung innerhalb einer Woche verfällt die Reservierung.\n\nLiebe Grüße,\nDas Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Reservierung bestätigt</title>
</head>
<body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; margin:20px 0; border-radius:8px; overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td style="padding:20px; text-align:center;">
              <img src="https://dasweinzelt.de/logo.png" alt="Weinzelt Logo" style="max-width:200px; height:auto;" />
            </td>
          </tr>
          <!-- Überschrift -->
          <tr>
            <td style="padding:0 20px 10px;">
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">Reservierung bestätigt</h1>
            </td>
          </tr>
          <!-- Bestätigungs-Box mit Zahlungsdaten -->
          <tr>
            <td style="padding:0 20px 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hallo <strong>${name}</strong>,</p>
                <p>deine Reservierung für <strong>${people} Personen</strong> am <strong>${date}</strong> um <strong>${timeslot}</strong> Uhr ist bestätigt!</p>
                <hr style="border:none; border-top:1px solid #cccccc; margin:16px 0;" />
                <p><strong>Dein gebuchtes Package:</strong><br/>
                  <strong>${packageName}</strong><br/>
                  ${packageDescription}
                  <br/>
                  <br/>
                  Getränke können auch vorab bestellt werden. So sind sie bei deiner Ankunft bereits für dich bereit! Antworte dazu einfach auf diese E-Mail und teile uns deine Wünsche mit. Wir kümmern uns um den Rest!
                </p>
                <hr style="border:none; border-top:1px solid #cccccc; margin:16px 0;" />
                <p><strong>Zahlungsdaten:</strong><br/>
                  Bitte überweise <strong>${price} €</strong> im Voraus auf folgendes Konto:<br/>
                  Name: Weinzelt GmbH<br/>
                  IBAN: DE48 3004 0000 0155 5085 00<br/>
                  BIC: COBADEFFXXX<br/>
                  Verwendungszweck: Tischreservierung ${name} / ${date} ${timeslot}
                </p>
                <p style="color:#000000; font-weight:bold;">
                  Zahlung innerhalb einer Woche erforderlich, sonst verfällt die Reservierung.
                </p>
              </div>
            </td>
          </tr>
          <!-- Hinweis zur Pünktlichkeit -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.4;">
              Bitte erscheine pünktlich: Nach 15 Minuten ab deiner gebuchten Zeit können wir leider keinen Eintritt mehr gewähren.
            </td>
          </tr>
          <!-- Rechtlicher Hinweis -->
          <tr>
            <td style="padding:0 20px 20px; font-size:12px; font-style:italic; color:#666666; line-height:1.4;">
              Weitere Details findest du in unseren 
              <a href="https://dasweinzelt.de/argb" style="color:#666666; text-decoration:underline;">Allgemeinen Reservierungs- und Geschäftsbedingungen</a>.
            </td>
          </tr>
          <!-- Abschiedsfloskel -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.5;">
              Wir freuen uns auf deinen Besuch!<br/><br/>
              Liebe Grüße<br/>
              Dein Weinzelt-Team
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#000000; padding:15px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#ffffff;">
                © ${new Date().getFullYear()} Weinzelt - Alle Rechte vorbehalten
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
