import { PackageType } from '@/lib/packages';

export default function PackageCard({
  pkg,
  price,
  selected,
  onSelect,
}: {
  pkg: PackageType;
  price: number;
  selected: boolean;
  onSelect: (pkg: PackageType) => void;
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden border-2 shadow-sm cursor-pointer transition-all duration-300 h-full flex flex-col ${
        selected ? 'border-black bg-gray-100' : 'border-white'
      }`}
      onClick={() => onSelect(pkg)}
    >
      <img
        src={pkg.image}
        alt={pkg.name}
        className="w-full h-60 object-cover"
      />
      <div className="p-4 grow flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
        <ul className="text-sm mb-2 text-gray-600 grow">
          {pkg.offering.map((str) => (
            <li key={`${pkg.name}-${str}`}>{str}</li>
          ))}
        </ul>
        <div className="flex gap-3 items-center">
          <p className="font-bold">{price.toLocaleString('de-DE')} €</p>
        </div>
      </div>
    </div>
  );
}
