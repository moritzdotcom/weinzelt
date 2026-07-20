// lib/mailer/sendReservationMail.ts
import { sendMail } from '@/lib/mailer';
import { Address } from '../reservation';
import { addressToHtml, addressToText } from './helpers/address';
import { renderShippingBlock } from './helpers/shippingBlock';

export default function sendCompanyReservationMail(
  email: string,
  people: number | string,
  date: string,
  timeslot: string,
  shippingAddress: Address | null,
) {
  const shippingText = shippingAddress
    ? addressToText(shippingAddress)
    : 'Keine Lieferadresse hinterlegt';

  const shippingHtml = shippingAddress
    ? addressToHtml(shippingAddress)
    : 'Keine Lieferadresse hinterlegt';

  const year = new Date().getFullYear();

  return sendMail({
    to: email,
    sendCopy: true,
    subject: 'Ihre Reservierung im Weinzelt wurde bestätigt',
    text:
      `Sehr geehrte Damen und Herren,\n\n` +
      `vielen Dank für Ihre Reservierung. Ihr Termin im Weinzelt wurde erfolgreich bestätigt.\n\n` +
      `Reservierungsdetails\n` +
      `- Personenzahl: ${people}\n` +
      `- Datum: ${date}\n` +
      `- Zeitfenster: ${timeslot} Uhr\n\n` +
      `Die Rechnung erhalten Sie in einer separaten E-Mail. Diese Nachricht stellt keine Rechnung dar.\n\n` +
      `Versand von Eintrittsbändchen und Verzehrkarten\n` +
      `Wir senden Ihnen die Unterlagen ca. 6 Wochen vor Beginn des Weinzelt an folgende Lieferadresse:\n\n` +
      `${shippingText}\n\n` +
      `Bitte prüfen Sie die Lieferadresse. Falls etwas nicht korrekt ist, antworten Sie einfach auf diese E-Mail.\n\n` +
      `Bitte erscheinen Sie pünktlich. Ab 15 Minuten nach Beginn Ihres gebuchten Zeitfensters kann der Einlass leider nicht mehr garantiert werden.\n\n` +
      `Weitere Informationen finden Sie in unseren Allgemeinen Reservierungs- und Geschäftsbedingungen:\n` +
      `https://dasweinzelt.de/argb\n\n` +
      `Wir freuen uns auf Ihren Besuch.\n\n` +
      `Mit freundlichen Grüßen\n` +
      `Ihr Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reservierung bestätigt</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f7f7; font-family:Arial,sans-serif; color:#222222;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Ihre Reservierung im Weinzelt wurde bestätigt. Die Rechnung erhalten Sie separat per E-Mail.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
          
          <tr>
            <td style="padding:28px 24px 12px; text-align:center;">
              <img
                src="https://dasweinzelt.de/logo.png"
                alt="Weinzelt Logo"
                style="display:block; margin:0 auto; max-width:180px; height:auto;"
              />
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 8px; text-align:center;">
              <h1 style="margin:0; font-size:26px; line-height:1.2; color:#222222;">
                Reservierung bestätigt
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 20px; text-align:center; font-size:15px; line-height:1.6; color:#555555;">
              Vielen Dank für Ihre Reservierung. Ihr Termin im Weinzelt wurde erfolgreich bestätigt.
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3; border-radius:10px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 12px; font-size:15px; font-weight:bold; color:#222222;">
                      Reservierungsdetails
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#333333;">
                      <strong>Personenzahl:</strong> ${people}
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#333333;">
                      <strong>Datum:</strong> ${date}
                    </p>
                    <p style="margin:0; font-size:15px; color:#333333;">
                      <strong>Zeitfenster:</strong> ${timeslot} Uhr
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 20px;">
              <div style="background:#f8f4ec; border:1px solid #eadfcb; border-radius:10px; padding:18px 20px;">
                <p style="margin:0 0 8px; font-size:15px; font-weight:bold; color:#222222;">
                  Rechnung
                </p>
                <p style="margin:0; font-size:14px; line-height:1.6; color:#444444;">
                  Die Rechnung erhalten Sie in einer separaten E-Mail. Diese Nachricht stellt keine Rechnung dar.
                </p>
              </div>
            </td>
          </tr>

          ${renderShippingBlock(shippingHtml, 'PICKUPWZ')}

          <tr>
            <td style="padding:0 24px 20px; font-size:14px; line-height:1.6; color:#444444;">
              Bitte erscheinen Sie pünktlich. Ab 15 Minuten nach Beginn Ihres gebuchten Zeitfensters kann der Einlass leider nicht mehr garantiert werden.
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 24px; font-size:13px; line-height:1.6; color:#666666;">
              Weitere Informationen finden Sie in unseren
              <a href="https://dasweinzelt.de/argb" style="color:#666666; text-decoration:underline;">
                Allgemeinen Reservierungs- und Geschäftsbedingungen
              </a>.
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 28px; font-size:14px; line-height:1.7; color:#333333;">
              Wir freuen uns auf Ihren Besuch.<br /><br />
              Mit freundlichen Grüßen<br />
              <strong>Ihr Weinzelt-Team</strong>
            </td>
          </tr>

          <tr>
            <td style="background:#111111; padding:16px 24px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#ffffff;">
                © ${year} Weinzelt - Alle Rechte vorbehalten
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
