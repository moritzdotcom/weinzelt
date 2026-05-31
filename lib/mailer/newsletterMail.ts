import { sendMail } from '@/lib/mailer';

const SITE_URL =
  process.env.APP_URL?.replace(/\/$/, '') || 'https://dasweinzelt.de';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTextAsHtml(value: string) {
  return escapeHtml(value).replaceAll('\n', '<br />');
}

export default function sendNewsletterMail(params: {
  email: string;
  name?: string | null;
  subject: string;
  headline: string;
  body: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  trackingToken: string;
  unsubscribeToken: string;
}) {
  const {
    email,
    name,
    subject,
    headline,
    body,
    imageUrl,
    ctaLabel,
    trackingToken,
    unsubscribeToken,
  } = params;

  const safeName = (name || '').trim();
  const greeting = safeName ? `Hallo ${safeName},` : 'Hallo,';

  const clickUrl = `${SITE_URL}/api/newsletter/click/${trackingToken}`;
  const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe/${unsubscribeToken}`;

  const ctaHtml = ctaLabel
    ? `
      <div style="text-align:center; margin:24px 0 8px;">
        <a
          href="${clickUrl}"
          style="display:inline-block; background-color:#000000; color:#ffffff; text-decoration:none; padding:14px 22px; border-radius:6px; font-weight:bold;"
        >
          ${escapeHtml(ctaLabel)}
        </a>
      </div>
    `
    : '';

  const imageHtml = imageUrl
    ? `
      <tr>
        <td>
          <img
            src="${escapeHtml(imageUrl)}"
            alt=""
            style="display:block; width:100%; max-width:600px; height:auto;"
          />
        </td>
      </tr>
    `
    : '';

  return sendMail({
    to: email,
    subject,
    text:
      `${greeting}\n\n` +
      `${headline}\n\n` +
      `${body}\n\n` +
      (ctaLabel ? `${ctaLabel}: ${clickUrl}\n\n` : '') +
      `Newsletter abbestellen: ${unsubscribeUrl}\n\n` +
      `Liebe Grüße\n` +
      `Dein Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;"
        >
          <tr>
            <td style="padding:22px; text-align:center;">
              <img
                src="https://dasweinzelt.de/logo.png"
                alt="Weinzelt Logo"
                style="max-width:200px; height:auto;"
              />
            </td>
          </tr>

          ${imageHtml}

          <tr>
            <td style="padding:28px 24px 8px;">
              <h1 style="margin:0; color:#222222; font-size:28px; line-height:1.2; text-align:center;">
                ${escapeHtml(headline)}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px 28px; color:#333333; font-size:16px; line-height:1.6;">
              <p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
              <p style="margin:0;">${formatTextAsHtml(body)}</p>

              ${ctaHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color:#000000; padding:18px 20px; text-align:center;">
              <p style="margin:0 0 8px; color:#ffffff; font-size:12px;">
                © ${new Date().getFullYear()} Weinzelt – Alle Rechte vorbehalten
              </p>
              <p style="margin:0; color:#cccccc; font-size:11px;">
                Du möchtest keine weiteren E-Mails erhalten?
                <a href="${unsubscribeUrl}" style="color:#ffffff; text-decoration:underline;">
                  Newsletter abbestellen
                </a>
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
