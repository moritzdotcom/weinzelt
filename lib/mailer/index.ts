import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465', // true bei 465, sonst false
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    bcc: process.env.MAIL_FROM,
    subject,
    text,
    html, // optional: hübsche HTML-Templates
  });
}
