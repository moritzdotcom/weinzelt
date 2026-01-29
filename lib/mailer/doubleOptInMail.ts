import { sendMail } from '@/lib/mailer';

export default function sendDoubleOptInMail(
  email: string,
  confirmUrl: string,
  name?: string | null,
) {
  const safeName = (name || '').trim();
  const greeting = safeName ? `Hallo ${safeName},` : 'Hallo,';

  return sendMail({
    to: email,
    subject: 'Bitte bestätige deine Newsletter-Anmeldung',
    text:
      `${greeting}\n\n` +
      `du hast dich mit dieser E-Mail-Adresse für unseren Weinzelt Newsletter angemeldet.\n` +
      `Bitte bestätige deine Anmeldung über diesen Link:\n\n` +
      `${confirmUrl}\n\n` +
      `Wenn du dich nicht angemeldet hast, kannst du diese E-Mail einfach ignorieren.\n\n` +
      `Liebe Grüße\n` +
      `Dein Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter Anmeldung bestätigen</title>
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
                Bitte bestätige deine Anmeldung
              </h1>
            </td>
          </tr>

          <!-- Content Box -->
          <tr>
            <td style="padding:0 20px 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p style="margin:0 0 12px;">${greeting}</p>
                <p style="margin:0 0 12px;">
                  du hast dich mit dieser E-Mail-Adresse für unseren <strong>Weinzelt Newsletter</strong> angemeldet.
                  Bitte bestätige kurz, dass du das wirklich möchtest.
                </p>

                <!-- Button -->
                <div style="text-align:center; margin:18px 0;">
                  <a href="${confirmUrl}"
                     style="display:inline-block; background-color:#000000; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:6px; font-weight:bold;">
                    Anmeldung bestätigen
                  </a>
                </div>

                <hr style="border:none; border-top:1px solid #cccccc; margin:16px 0;" />

                <p style="margin:0 0 10px; font-size:14px; color:#555555;">
                  Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
                </p>
                <p style="margin:0; font-size:12px; color:#666666; word-break:break-all;">
                  <a href="${confirmUrl}" style="color:#666666; text-decoration:underline;">
                    ${confirmUrl}
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Hinweis -->
          <tr>
            <td style="padding:0 20px 16px; font-size:12px; color:#666666; line-height:1.4;">
              Wenn du dich nicht angemeldet hast, kannst du diese E-Mail einfach ignorieren.
            </td>
          </tr>

          <!-- Datenschutz / Rechtliches -->
          <tr>
            <td style="padding:0 20px 20px; font-size:12px; font-style:italic; color:#666666; line-height:1.4;">
              Infos zum Umgang mit deinen Daten findest du in unserer
              <a href="https://dasweinzelt.de/datenschutz" style="color:#666666; text-decoration:underline;">Datenschutzerklärung</a>.
            </td>
          </tr>

          <!-- Abschiedsfloskel -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.5;">
              Danke & bis bald!<br/><br/>
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
