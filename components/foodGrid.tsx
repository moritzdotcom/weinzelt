export default function FoodGrid() {
  const menuItems = [
    {
      name: 'APÉRO PLATTE',
      image: '/home/food/1.webp',
    },
    {
      name: 'TRÜFFEL PASTA AUF CARPACCIO',
      image: '/home/food/2.webp',
    },
    {
      name: 'WEINZELT SPRITZ',
      image: '/home/food/3.webp',
    },
    {
      name: 'RUCOLA FLAP SANDWICH',
      image: '/home/food/4.webp',
    },
    {
      name: 'BLACK ANGUS BAVETTE',
      image: '/home/food/5.webp',
    },
    {
      name: 'TAGLIARINI ALLA NORMA',
      image: '/home/food/6.webp',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-center text-3xl sm:text-4xl mb-10 font-cocogoose">
        Einige Highlights aus unserer Karte
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="relative group overflow-hidden rounded-2xl shadow-lg"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-64 object-cover transform group-hover:scale-105 transition duration-300 ease-in-out"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-300 flex items-center justify-center">
              <span className="text-white text-2xl font-light font-cocogoose text-center px-2">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
