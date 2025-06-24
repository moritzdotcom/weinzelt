import { Check, CopyAll } from '@mui/icons-material';
import { useState } from 'react';

export default function CopyButton({
  label,
  data,
}: {
  label: string;
  data: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      disabled={copied}
      className={
        'w-full mt-3 py-2 rounded text-neutral-800 transition flex items-center justify-center gap-2 border text-sm' +
        (copied
          ? ' bg-emerald-300 border-emerald-300 hover:bg-emerald-500'
          : ' bg-neutral-200 border-neutral-200 hover:bg-neutral-300')
      }
    >
      {copied ? <Check fontSize="small" /> : <CopyAll fontSize="small" />}
      <p>{copied ? 'Kopiert!' : label}</p>
    </button>
  );
}
