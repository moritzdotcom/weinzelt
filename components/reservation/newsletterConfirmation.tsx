import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import { ChangeEvent, useState } from 'react';

export default function NewsletterConfirmation({
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
          }}
        >
          Ich möchte den Weinzelt-Newsletter mit Neuigkeiten und Angeboten
          erhalten.
        </Typography>
      }
      sx={{
        width: '100%',
        justifyContent: 'start',
        mt: 1,
        mb: 2,
      }}
    />
  );
}
