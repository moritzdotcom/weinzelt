import { sendMail } from '@/lib/mailer';

export default function sendPaymentReminderMail(
  email: string,
  name: string,
  people: number,
  date: string,
  timeslot: string,
  price: number
) {
  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Zahlungserinnerung für deine Weinzelt-Reservierung',
    text: `Hallo ${name},\n\nmanchmal schmeckt der Wein so gut, dass wir die wichtigen Dinge aus den Augen verlieren - uns ist aufgefallen, dass die Zahlung von ${price} € für deine Reservierung (${people} Pers. am ${date} um ${timeslot}) noch aussteht.\n\nBitte überweise den Betrag innerhalb der nächsten 3 Tage, sonst müssen wir deine Reservierung leider stornieren.\n\nLiebe Grüße,\nDein Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Zahlungserinnerung</title>
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
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">
                Zahlungserinnerung
              </h1>
            </td>
          </tr>
          <!-- Erinnerungs-Box mit Zahlungsdaten -->
          <tr>
            <td style="padding:0 20px 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hallo <strong>${name}</strong>,</p>
                <p>manchmal schmeckt der Wein so gut, dass die wichtigen Dinge in Vergessenheit geraten - uns ist aufgefallen, dass die Zahlung für deine Reservierung noch nicht eingegangen ist.</p>
                <hr style="border:none; border-top:1px solid #cccccc; margin:16px 0;" />
                <p>
                  <strong>Reservierung:</strong><br/>
                  ${people} Personen am ${date} um ${timeslot} Uhr
                </p>
                <p>
                  <strong>Betrag:</strong> ${price} €
                </p>
                <hr style="border:none; border-top:1px solid #cccccc; margin:16px 0;" />
                <p><strong>Zahlungsdaten:</strong><br/>
                  Name: Weinzelt GmbH<br/>
                  IBAN: DE48 3004 0000 0155 5085 00<br/>
                  BIC: COBADEFFXXX<br/>
                  Verwendungszweck: Tischreservierung ${name} / ${date} ${timeslot}
                </p>
                <p style="color:#cc0000; font-weight:bold;">
                  Bitte überweise innerhalb der nächsten <strong>3 Tage</strong>. Ansonsten stornieren wir deine Reservierung.
                </p>
              </div>
            </td>
          </tr>
          <!-- Rechtlicher Hinweis -->
          <tr>
            <td style="padding:0 20px 20px; font-size:12px; font-style:italic; color:#666666; line-height:1.4;">
              Weitere Details findest du in unseren 
              <a href="https://dasweinzelt.de/argb"
                 style="color:#666666; text-decoration:underline;">
                Allgemeinen Reservierungs- und Geschäftsbedingungen
              </a>.
            </td>
          </tr>
          <!-- Abschiedsfloskel -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.5;">
              Wir freuen uns darauf, dich bald im Weinzelt zu begrüßen!<br/><br/>
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
