import { sendMail } from '@/lib/mailer';

export default function sendSpecialEventConfirmationMail(
  email: string,
  eventName: string,
  name: string,
  people: number,
  date: string,
  startTime: string
) {
  return sendMail({
    to: email,
    subject: `Deine Registrierung für ${eventName}`,
    text: `Hallo ${name},\n\nDu hast dich erfolgreich für ${eventName} mit ${people} ${
      people == 1 ? 'Person' : 'Personen'
    } registriert. Wir starten am ${date} um ${startTime}. Wir freuen uns auf deinen Besuch!\n\nLiebe Grüße,\nDas Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Registrierung bestätigt</title>
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
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">Deine Registrierung ist bestätigt</h1>
            </td>
          </tr>
          <!-- Bestätigungs-Box mit Zahlungsdaten -->
          <tr>
            <td style="padding:0 20px 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Hallo <strong>${name}</strong>,</p>
                <p>Du hast dich erfolgreich für ${eventName} mit ${people} ${
      people == 1 ? 'Person' : 'Personen'
    } registriert.</p>
                <p>Wir starten am ${date} um ${startTime}.</p>
              </div>
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
