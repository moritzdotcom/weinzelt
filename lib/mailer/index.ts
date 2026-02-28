import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

type MailAttachment = {
  filename: string;
  content: Buffer | string; // Buffer (PDF), string (text/base64)
  contentType?: string; // e.g. 'application/pdf'
  encoding?: 'base64' | 'utf8';
};

export function sendMail({
  to,
  subject,
  text,
  html,
  sendCopy,
  attachments,
  replyTo,
  cc,
  bcc,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  sendCopy?: boolean;

  // NEW:
  attachments?: MailAttachment[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error('MAIL_FROM is not set');

  // 기존 behaviour: sendCopy -> bcc to MAIL_FROM
  const finalBcc = bcc ?? (sendCopy ? process.env.MAIL_FROM : undefined);

  return transporter.sendMail({
    from,
    to,
    cc,
    bcc: finalBcc,
    replyTo,
    subject,
    text,
    html,

    // NEW:
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      encoding: a.encoding,
    })),
  });
}
