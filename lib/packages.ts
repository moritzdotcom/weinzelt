export type PackageType =
  | {
      id: number;
      name: string;
      description: string;
      strikePrice: number;
      price: number;
      image: string;
    }
  | {
      id: number;
      name: string;
      description: string;
      price: number;
      image: string;
      strikePrice?: undefined;
    };

export const packages = [
  {
    id: 1,
    name: 'Champagner Package',
    description:
      'Inklusive 3 Flaschen Champagner, 3 Flaschen Wein, bevorzugter Einlass.',
    strikePrice: 800,
    price: 800,
    image: '/packages/champagner.png',
  },
  {
    id: 2,
    name: 'Sommelier Package',
    description:
      'Raritäten-Verkostung mit persönlichem Sommelier, 6 Top-Weine, bevorzugter Einlass.',
    strikePrice: 550,
    price: 550,
    image: '/packages/sommelier.png',
  },
  {
    id: 3,
    name: 'Party Package',
    description:
      '2 Flaschen Wein nach Wahl, 1 Flasche Belvedere inkl. Mischgetränken, bevorzugter Einlass.',
    strikePrice: 480,
    price: 480,
    image: '/packages/party.png',
  },
  {
    id: 4,
    name: 'Magnum Package',
    description:
      '2 Flaschen Wein nach Wahl, 1 Flasche Belvedere inkl. Mischgetränken, bevorzugter Einlass.',
    strikePrice: 480,
    price: 480,
    image: '/packages/magnum.png',
  },
  {
    id: 5,
    name: 'Individuell',
    description:
      'Kein Paket - Mindestverzehr 65€ pro Person, bevorzugter Einlass.',
    price: 0,
    image: '/packages/individual.png',
  },
];

export const validatePackage = (
  name: string,
  description: string,
  price: number
) => {
  const pkg = packages.find(
    (p) => p.name == name && p.description == description && p.price == price
  );
  return pkg;
};
