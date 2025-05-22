export type PriceType = 'FLAT' | 'PERPERSON' | 'MVZEXCLFOOD';

export type PackageType = {
  id: number;
  sortId: number;
  name: string;
  description: string;
  offering: string[];
  price: number;
  priceType: PriceType;
  image: string;
};

export const packages: PackageType[] = [
  {
    id: 1,
    sortId: 1,
    name: 'Party Package',
    description:
      '1 x Weindampfer Rosé 3l, 1 x Champagner Remy Massin 1,5l, 1 x Belvedere 0,7l mit 6 Mischgetränken, 3 x Wein aus dem offenen Ausschank, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '1 x Weindampfer Rosé 3l',
      '1 x Champagner Remy Massin 1,5l',
      '1 x Belvedere 0,7l',
      '6 x Mischgetränke',
      '3 x Wein aus dem offenen Ausschank',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 680,
    priceType: 'FLAT',
    image: '/packages/party.jpg',
  },
  {
    id: 2,
    sortId: 2,
    name: 'PINK BABY Package',
    description:
      '2 x Weindampfer Rosé 1,5l, 2 x Ruinart Rosé 0,75l, 1 x Belvedere 0,7l mit 6 Goldberg Wild Berry, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '2 x Weindampfer Rosé 1,5l',
      '2 x Ruinart Rosé 0,75l',
      '1 x Belvedere 0,7l',
      '6 x Goldberg Wild Berry',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 699,
    priceType: 'FLAT',
    image: '/packages/pinkBaby.jpg',
  },
  {
    id: 3,
    sortId: 3,
    name: 'Champagner Package',
    description:
      '1 x Dom Perignon Luminous 1,5l, 3 x Ruinart Blanc/Rosé 0,75l, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '1 x Dom Perignon Luminous 1,5l',
      '3 x Ruinart Blanc/Rosé 0,75l',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 1399,
    priceType: 'FLAT',
    image: '/packages/champagner.jpg',
  },
  {
    id: 4,
    sortId: 4,
    name: 'Die Keller Kiste',
    description:
      '1 x Keller Kiste (12 Flaschen Wein 0,75l), 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '1 x Keller Kiste (12 Flaschen Wein 0,75l)',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 9479,
    priceType: 'FLAT',
    image: '/packages/keller.jpg',
  },
  {
    id: 5,
    sortId: 5,
    name: 'Sommelier Package',
    description:
      '800€ Weinguthaben im Weinzelt. Sommelier-Begleitung durch die Wein-Lounge mit Auswahl der richtigen Weine (Absprache Vorab möglich).',
    offering: [
      '800€ Weinguthaben im Weinzelt',
      'Sommelier-Begleitung durch die Wein-Lounge mit Auswahl der richtigen Weine (Absprache Vorab möglich).',
    ],
    price: 800,
    priceType: 'FLAT',
    image: '/packages/sommelier.jpg',
  },
  {
    id: 6,
    sortId: 6,
    name: 'ICE ICE BABY',
    description:
      '6 x Moêt Ice 0,75l, 1 x Belvedere 0,7l mit 6 Mischgetränken, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '6 x Moêt Ice 0,75l',
      '1 x Belvedere 0,7l',
      '6 x Mischgetränke',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 1750,
    priceType: 'FLAT',
    image: '/packages/ice.jpg',
  },
  {
    id: 7,
    sortId: 7,
    name: 'CRASH ROYAL',
    description:
      '2 x Louis Roederer Cristal 1,5l, 2 x Dom Perignon Luminous 1,5l, 1 x Belvedere 0,7l mit 6 Mischgetränken, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '2 x Louis Roederer Cristal 1,5l',
      '2 x Dom Perignon Luminous 1,5l',
      '1 x Belvedere 0,7l',
      '6 x Mischgetränke',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 4580,
    priceType: 'FLAT',
    image: '/packages/royal.jpg',
  },
  {
    id: 8,
    sortId: 8,
    name: 'Captains Table Pakage',
    description:
      '1 x Champagner Remy Massin 1,5l, 2 x Weindampfer Rosé 1,5l, 2 x Knut Hansen Dry Gin 0,5l mit 12 Mischgetränken, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '1 x Champagner Remy Massin 1,5l',
      '2 x Weindampfer Rosé 1,5l',
      '2 x Knut Hansen Dry Gin 0,5l',
      '12 x Mischgetränke',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 780,
    priceType: 'FLAT',
    image: '/packages/captain.jpg',
  },
  {
    id: 9,
    sortId: 9,
    name: 'One Night with Cristal',
    description:
      '1 x Louis Roederer Cristal 1,5l, 3 x Louis Roederer Cristal 0,75l, 4 x Gerolsteiner Mineralwasser 0,75l',
    offering: [
      '1 x Louis Roederer Cristal 1,5l',
      '3 x Louis Roederer Cristal 0,75l',
      '4 x Gerolsteiner Mineralwasser 0,75l',
    ],
    price: 2399,
    priceType: 'FLAT',
    image: '/packages/cristal.jpg',
  },
  {
    id: 10,
    sortId: 10,
    name: 'Flex Paket',
    description: 'Kein Paket, Flexibler Mindestverzehr für Essen und Getränke.',
    offering: ['Kein Paket, Flexibler Mindestverzehr für Essen und Getränke.'],
    price: 800,
    priceType: 'MVZEXCLFOOD',
    image: '/packages/flex.jpg',
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
