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
      className={`rounded-xl overflow-hidden border-2 shadow-sm cursor-pointer transition-all duration-300 ${
        selected ? 'border-black bg-gray-100' : 'border-white'
      }`}
      onClick={() => onSelect(pkg)}
    >
      <img
        src={pkg.image}
        alt={pkg.name}
        className="w-full h-60 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>
        <p className="text-sm mb-2 text-gray-600">{pkg.description}</p>
        <div className="flex gap-3 items-center">
          {pkg.strikePrice && (
            <s className="text-gray-500">
              {pkg.strikePrice.toLocaleString('de-DE')} €
            </s>
          )}
          <p className="font-bold">{price.toLocaleString('de-DE')} €</p>
        </div>
      </div>
    </div>
  );
}
