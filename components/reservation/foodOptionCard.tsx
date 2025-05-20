import { FoodOptionType } from '@/lib/foodOptions';

export default function FoodOptionCard({
  food,
  selected,
  onSelect,
  disabled,
}: {
  food: FoodOptionType;
  selected: boolean;
  onSelect: (food: FoodOptionType) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl overflow-hidden border-2 shadow-sm transition-all duration-300 ${
        selected
          ? 'border-black bg-gray-100'
          : disabled
          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
          : 'cursor-pointer border-white'
      }`}
      onClick={() => (disabled ? {} : onSelect(food))}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="">
          <h3 className="text-lg font-semibold">{food.name}</h3>
          {food.description && (
            <p className="text-sm text-gray-600">{food.description}</p>
          )}
        </div>
        {food.price && (
          <div className="">
            <p className="font-bold whitespace-nowrap">+ {food.price} € p.P.</p>
          </div>
        )}
      </div>
    </div>
  );
}
