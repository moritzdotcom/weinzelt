export default function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 mt-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-green-500 animate-[ping_1.2s_ease-out_1]" />
        <div className="absolute inset-[6px] rounded-full bg-white flex items-center justify-center animate-[scaleIn_0.4s_ease-out_forwards]">
          <svg
            className="w-10 h-10 text-green-500 animate-drawCheck"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <p className="text-green-600 font-semibold text-lg">
        Erfolgreich eingetragen!
      </p>
    </div>
  );
}
