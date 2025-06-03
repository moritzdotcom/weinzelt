import { ApiGetReferralCodeResponse } from '@/pages/api/referralCodes/getCode';
import { TextField } from '@mui/material';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function ReferralCodeField({
  onValidCode,
}: {
  onValidCode: (code: ApiGetReferralCodeResponse) => void;
}) {
  const [code, setCode] = useState('');
  const [referralCode, setReferralCode] =
    useState<ApiGetReferralCodeResponse | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateCode = (c: string) => {
    setCode(c);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (c.length <= 0) return;

    debounceTimeout.current = setTimeout(async () => {
      try {
        const { data } = await axios<ApiGetReferralCodeResponse>(
          '/api/referralCodes/getCode',
          { params: { code: c } }
        );
        onValidCode(data);
        setReferralCode(data);
      } catch (error) {}
    }, 1000);
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('code');
    if (savedCode) {
      updateCode(savedCode);
    }
  }, []);

  return (
    <>
      <TextField
        fullWidth
        label="Code"
        value={code}
        onChange={(e) => updateCode(e.target.value)}
        margin="normal"
      />
      {referralCode && (
        <div className="p-3 rounded bg-green-50 font-semibold">
          Dein Vorteil: {referralCode.description}
        </div>
      )}
    </>
  );
}
