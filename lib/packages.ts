export type PriceType = 'FLAT' | 'PERPERSON' | 'MVZEXCLFOOD';

export type PackageType =
  | {
      id: number;
      name: string;
      description: string;
      strikePrice: number;
      price: number;
      priceType: PriceType;
      image: string;
    }
  | {
      id: number;
      name: string;
      description: string;
      price: number;
      priceType: PriceType;
      image: string;
      strikePrice?: undefined;
    };

export const packages: PackageType[] = [
  {
    id: 1,
    name: 'Party Package',
    description:
      '1 x Weindampfer Rosé 3l, 1 x Champagner Remy Massin 1,5l, 1 x Belvedere 0,7l mit Mischgetränken, 3 x Wein aus dem offenen Ausschank, 4 x Gerolsteiner Mineralwasser',
    strikePrice: 689,
    price: 680,
    priceType: 'FLAT',
    image: '/packages/party2.jpg',
  },
  {
    id: 2,
    name: 'PINK BABY Package',
    description:
      '2 x Weindampfer Rosé 1,5l, 2 x Ruinart Rosé 0,75l, 1 x Belvedere 0,7l mit 6 Schweppes Wild Berry, 4 x Gerolsteiner Mineralwasser',
    strikePrice: 717,
    price: 705,
    priceType: 'FLAT',
    image: '/packages/pinkBaby2.jpg',
  },
  {
    id: 3,
    name: 'Champagner Package',
    description:
      '1 x Flasche Dom Perignon Luminous 1,5l, 3 x Ruinart Blanc/Rosé 0,75l, 4 x Gerolsteiner Mineralwasser',
    strikePrice: 1472,
    price: 1430,
    priceType: 'FLAT',
    image: '/packages/champagner2.jpg',
  },
  {
    id: 4,
    name: 'Die Keller Kiste',
    description:
      '1 x Keller Kiste (12 Flaschen Wein 0,75l), 4 x Gerolsteiner Mineralwasser',
    price: 9479,
    priceType: 'FLAT',
    image: '/packages/keller2.jpg',
  },
  {
    id: 5,
    name: 'Sommelier Package',
    description:
      '800€ Weinguthaben im Weinzelt. Sommelier-Begleitung durch die Wein-Lounge mit Auswahl der richtigen Weine (Absprache Vorab möglich).',
    price: 800,
    priceType: 'FLAT',
    image: '/packages/sommelier2.jpg',
  },
  {
    id: 6,
    name: 'ICE ICE BABY',
    description:
      '6 x Moêt Ice 0,75l, 1 x Belvedere 0,7l mit 6 Mischgetränken, 4 x Gerolsteiner Mineralwasser',
    strikePrice: 1785,
    price: 1750,
    priceType: 'FLAT',
    image: '/packages/ice2.jpg',
  },
  {
    id: 7,
    name: 'Flex Paket',
    description: 'Kein Paket, Flexibler Mindestverzehr für Essen und Getränke.',
    price: 800,
    priceType: 'MVZEXCLFOOD',
    image: '/packages/flex2.jpg',
  },
];

export function calculatePackagePrice(
  pck: PackageType,
  people: number,
  foodPrice: number,
  overridePrice?: number
) {
  if (pck.priceType == 'FLAT') return pck.price;
  if (pck.priceType == 'PERPERSON') return pck.price * people;
  if (pck.priceType == 'MVZEXCLFOOD')
    return (overridePrice || pck.price) - foodPrice;
  return pck.price;
}

export const validatePackage = (
  name: string,
  description: string,
  price: number
) => {
  const pkg = packages.find(
    (p) => p.name == name && p.description == description
  );
  return pkg;
};
