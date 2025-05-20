import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import Link from 'next/link';
import { ChangeEvent, useState } from 'react';

export default function ARGBConfirmation({
  onChecked,
}: {
  onChecked: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onChecked(e.target.checked);
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={handleChange}
          sx={{
            color: 'black',
            '&.Mui-checked': { color: 'black' },
          }}
        />
      }
      label={
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            color: '#333333',
            display: 'inline',
          }}
        >
          Mit dem Absenden akzeptierst du die{' '}
          <Link
            href="/argb"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'underline',
              color: 'black',
            }}
          >
            Allgemeinen Reservierungs- und Geschäftsbedingungen
          </Link>
          .*
        </Typography>
      }
      sx={{
        width: '100%',
        justifyContent: 'start',
        mt: 2,
      }}
    />
  );
}
