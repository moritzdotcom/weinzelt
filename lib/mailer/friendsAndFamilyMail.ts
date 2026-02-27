import { sendMail } from '@/lib/mailer';

function formatEUR(amount: number) {
  // amount ist bei dir Int. Wenn das Euro sind: so lassen.
  // Wenn es CENT sind, ändere zu: amount / 100
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export default function sendFriendsAndFamilyMail(
  email: string,
  name: string,
  people: string,
  date: string,
  timeslot: string,
  invitedByUserName: string,
  minimumSpend: number,
) {
  const minSpendFormatted = formatEUR(minimumSpend);

  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Deine Reservierung wurde bestätigt',
    text: `Hallo ${name},\n\ndeine Reservierung für ${people} Pers. am ${date} für den Zeitraum ${timeslot} ist bestätigt!\n\nABHOLUNG & ZAHLUNG\nEintrittsbändchen und Verzehrkarten werden nicht versendet, sondern zeitnah bei uns abgeholt.\nBitte melde dich dazu am besten direkt bei ${invitedByUserName} und stimmt alles gemeinsam ab.\nDie Zahlung erfolgt bei der Abholung.\nMindestverzehr: ${minSpendFormatted}\n\nWir freuen uns auf dich.\n\nLiebe Grüße,\nDas Weinzelt-Team`,
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
          <!-- Bestätigungs-Box -->
          <tr>
            <td style="padding:0 20px 14px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                Hallo <strong>${name}</strong>,<br/>
                deine Reservierung für <strong>${people} Personen</strong> am <strong>${date}</strong> für den Zeitraum <strong>${timeslot}</strong> Uhr ist hiermit bestätigt!
              </div>
            </td>
          </tr>

          <!-- Abholung / Zahlung Hinweis-Box (gleiches Pattern wie Versand-Box) -->
          <tr>
            <td style="padding:0 20px 16px;">
              <div style="background-color:#fff7e6; padding:16px; border-radius:5px; color:#333333; font-size:14px; line-height:1.5;">
                <p style="margin:0 0 10px;"><strong>Abholung von Eintrittsbändchen &amp; Verzehrkarten</strong></p>
                <p style="margin:0 0 10px;">
                  Deine Eintrittsbändchen und Verzehrkarten kannst du zeitnah bei uns abholen.
                </p>
                <p style="margin:0 0 10px;">
                  Bitte stimme dich hierzu am besten mit <strong>${invitedByUserName}</strong> ab.
                </p>
                <p style="margin:0; padding:10px 12px; background:#ffffff; border:1px solid #eee; border-radius:4px;">
                  <strong>Zahlung bei Abholung</strong><br/>
                  Mindestverzehr: <strong>${minSpendFormatted}</strong>
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
