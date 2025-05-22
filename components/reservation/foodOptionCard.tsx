import { Add, Remove } from '@mui/icons-material';

export default function FoodOptionCard({
  title,
  value,
  menuPrice,
  onChange,
  maxValue,
}: {
  title: string;
  value: number;
  menuPrice: number;
  onChange: (value: number) => void;
  maxValue: number;
}) {
  return (
    <div className="p-4 rounded-xl overflow-hidden border border-neutral-300 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-300 disabled:opacity-30"
            disabled={value <= 0}
            onClick={() => {
              if (value > 0) {
                onChange(value - 1);
              }
            }}
          >
            <Remove />
          </button>
          <span className="text-lg font-semibold">{value}</span>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-300 disabled:opacity-30"
            disabled={value >= maxValue}
            onClick={() => {
              if (value < maxValue) {
                onChange(value + 1);
              }
            }}
          >
            <Add />
          </button>
          <p className="min-w-16 text-right">
            + {(value * menuPrice).toLocaleString('de-DE')} €
          </p>
        </div>
      </div>
    </div>
  );
}
