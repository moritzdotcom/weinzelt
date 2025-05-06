import { NextApiRequest, NextApiResponse } from 'next';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await handleGET(req, res);
  } else if (req.method === 'POST') {
    await handlePOST(req, res);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}

export type ApiGetBrandsResponse = {
  id: string;
  name: string;
}[];

async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  const reservations = {
    dates: [
      {
        date: '11.07.25',
        dow: 'FR',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 1 },
          { timeslot: '15:00 - 19:00', available: 3 },
          { timeslot: '21:00 - 00:00', available: 2 },
        ],
      },
      {
        date: '12.07.25',
        dow: 'SA',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 4 },
          { timeslot: '15:00 - 19:00', available: 7 },
        ],
      },
      {
        date: '13.07.25',
        dow: 'SO',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 7 },
          { timeslot: '15:00 - 19:00', available: 1 },
        ],
      },
      {
        date: '14.07.25',
        dow: 'MO',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 0 },
          { timeslot: '15:00 - 19:00', available: 1 },
        ],
      },
      {
        date: '15.07.25',
        dow: 'DI',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 0 },
          { timeslot: '15:00 - 19:00', available: 0 },
        ],
      },
      {
        date: '16.07.25',
        dow: 'MI',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 12 },
          { timeslot: '15:00 - 19:00', available: 7 },
        ],
      },
      {
        date: '17.07.25',
        dow: 'DO',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 10 },
          { timeslot: '15:00 - 19:00', available: 2 },
        ],
      },
      {
        date: '18.07.25',
        dow: 'FR',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 3 },
          { timeslot: '15:00 - 19:00', available: 1 },
        ],
      },
      {
        date: '19.07.25',
        dow: 'SA',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 0 },
          { timeslot: '15:00 - 19:00', available: 0 },
        ],
      },
      {
        date: '20.07.25',
        dow: 'SO',
        seatings: [
          { timeslot: '11:00 - 15:00', available: 0 },
          { timeslot: '15:00 - 19:00', available: 2 },
        ],
      },
    ],
  };
  return res.json(reservations);
}

export type ApiPostBrandsResponse = {
  id: string;
  name: string;
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  return res.json('YOO');
}
