import { sendMail } from '@/lib/mailer';

export default function sendReservationInvoiceMail(opts: {
  to: string;
  name: string;
  invoiceNumber: string;
  invoicePdf: Buffer;
}) {
  const subject = `Deine Rechnung ${opts.invoiceNumber} – Weinzelt`;

  return sendMail({
    to: opts.to,
    sendCopy: true,
    subject,
    text: `Hallo ${opts.name},\n\nanbei findest du deine Rechnung (${opts.invoiceNumber}).\n\nLiebe Grüße\nDas Weinzelt-Team`,
    html: `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="padding:20px;text-align:center;">
      <img src="https://dasweinzelt.de/logo.png" alt="Weinzelt" style="max-width:200px;height:auto;" />
    </div>
    <div style="padding:0 20px 20px;">
      <h2 style="margin:0 0 12px;">Rechnung</h2>
      <p style="margin:0 0 12px;">Hallo <b>${opts.name}</b>,</p>
      <p style="margin:0 0 12px;">
        anbei findest du deine Rechnung <b>${opts.invoiceNumber}</b> als PDF.
      </p>
      <p style="margin:0;">Liebe Grüße<br/>Dein Weinzelt-Team</p>
    </div>
    <div style="background:#000;padding:14px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} Weinzelt
    </div>
  </div>
</body>
</html>`,
    attachments: [
      {
        filename: `Rechnung_${opts.invoiceNumber}.pdf`,
        content: opts.invoicePdf,
        contentType: 'application/pdf',
      },
    ],
  });
}
