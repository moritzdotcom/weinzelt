import { NextApiRequest, NextApiResponse } from 'next';
import sendJobApplicationMail from '@/lib/mailer/jobApplicationMail';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { name, email, availability, selectedJob } = req.body;
  await sendJobApplicationMail(email, name, availability, selectedJob);
  return res.json('SUCCESS');
}
