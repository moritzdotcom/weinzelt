// /lib/mailer/sendBackendUserInviteMail.ts

import { sendMail } from '@/lib/mailer';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function sendBackendUserInviteMail({
  email,
  name,
  temporaryPassword,
}: {
  email: string;
  name: string;
  temporaryPassword: string;
}) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://dasweinzelt.de';

  const loginUrl = `${appUrl}/backend/login`;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeTemporaryPassword = escapeHtml(temporaryPassword);

  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Einladung ins Weinzelt Backend',
    text: `Hallo ${name},

du wurdest für das Weinzelt Backend eingeladen.

Du kannst dich ab sofort unter folgendem Link einloggen:
${loginUrl}

Deine Zugangsdaten:

E-Mail:
${email}

Vorläufiges Passwort:
${temporaryPassword}

Bitte ändere dein Passwort nach dem ersten Login, sofern dir diese Funktion im Backend zur Verfügung steht.

Liebe Grüße
Dein Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Einladung ins Weinzelt Backend</title>
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
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">Einladung ins Backend</h1>
            </td>
          </tr>

          <!-- Einladung -->
          <tr>
            <td style="padding:0 20px 16px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p style="margin-top:0;">Hallo <strong>${safeName}</strong>,</p>
                <p>
                  du wurdest für das <strong>Weinzelt Backend</strong> eingeladen.
                  Dort kannst du die für dich freigeschalteten Bereiche verwalten.
                </p>
                <p style="margin-bottom:0;">
                  Über den folgenden Button gelangst du direkt zum Login.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 20px 16px; text-align:center;">
              <a href="${loginUrl}" style="display:inline-block; background-color:#000000; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:5px; font-size:15px; font-weight:bold;">
                Zum Backend Login
              </a>
            </td>
          </tr>

          <!-- Zugangsdaten -->
          <tr>
            <td style="padding:0 20px 16px;">
              <div style="background-color:#fff7e6; padding:16px; border-radius:5px; color:#333333; font-size:14px; line-height:1.5;">
                <p style="margin:0 0 10px;"><strong>Deine Zugangsdaten</strong></p>

                <p style="margin:0 0 8px;">
                  <strong>E-Mail:</strong><br/>
                  <span style="font-family:Arial,sans-serif;">${safeEmail}</span>
                </p>

                <p style="margin:0;">
                  <strong>Vorläufiges Passwort:</strong><br/>
                  <span style="display:inline-block; margin-top:4px; padding:10px 12px; background:#ffffff; border:1px solid #eee; border-radius:4px; font-family:Courier New,monospace; font-size:15px;">
                    ${safeTemporaryPassword}
                  </span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Hinweis -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.4;">
              Bitte bewahre deine Zugangsdaten sicher auf. Falls du dich nicht einloggen kannst oder die Einladung nicht erwartet hast, antworte einfach auf diese E-Mail.
            </td>
          </tr>

          <!-- Abschiedsfloskel -->
          <tr>
            <td style="padding:0 20px 20px; color:#333333; font-size:14px; line-height:1.5;">
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
