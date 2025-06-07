import { sendMail } from '@/lib/mailer';

export default function sendJobApplicationMail(
  email: string,
  name: string,
  availability: string,
  selectedJob: string
) {
  return sendMail({
    to: 'jobs@dasweinzelt.de',
    subject: 'Neue Bewerbung für das Weinzelt-Team',
    text: `Neue Bewerbung:\n\nName: ${name}\nE-Mail: ${email}\nVerfügbarkeit: ${availability}\nAusgewählter Job: ${selectedJob}`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Neue Bewerbung - Weinzelt</title>
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
              <h1 style="margin:0; font-size:24px; color:#333333; text-align:center;">Neue Bewerbung erhalten</h1>
            </td>
          </tr>
          <!-- Bewerbungs-Box -->
          <tr>
            <td style="padding:0 20px 20px;">
              <div style="background-color:#f0f0f0; padding:20px; border-radius:5px; color:#333333; font-size:16px; line-height:1.5;">
                <p>Du hast eine neue Bewerbung erhalten!</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>E-Mail:</strong> ${email}</p>
                <p><strong>Verfügbarkeit im Zeitraum 11.07. bis 20.07.:</strong> ${availability}</p>
                <p><strong>Ausgewählter Job:</strong> ${selectedJob}</p>
              </div>
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
