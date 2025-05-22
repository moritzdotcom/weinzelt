export type FoodOptionType = {
  id: number;
  name: string;
  description?: string;
  price?: number;
};

export const foodOptions = [
  {
    id: 1,
    name: 'Exquisites 3 Gänge Menu',
    description:
      'Vorspeisenplatte, Hauptspeise (Fisch/Fleisch/Vegetarisch) und Dessert',
    price: 65,
  },
  {
    id: 2,
    name: 'Kein Essen',
  },
];
