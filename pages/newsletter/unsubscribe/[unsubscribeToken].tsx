import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function NewsletterUnsubscribePage() {
  const router = useRouter();

  const unsubscribeToken =
    typeof router.query.unsubscribeToken === 'string'
      ? router.query.unsubscribeToken
      : undefined;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleUnsubscribe = async () => {
    if (!unsubscribeToken) return;

    try {
      setLoading(true);

      await axios.post(`/api/newsletter/unsubscribe/${unsubscribeToken}`);

      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={560} mx="auto" px={2} py={8}>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={600}>
              Newsletter abbestellen
            </Typography>

            {done ? (
              <Alert severity="success">
                Du erhältst ab sofort keine weiteren Newsletter von uns.
              </Alert>
            ) : (
              <>
                <Typography color="text.secondary">
                  Möchtest du dich wirklich vom Weinzelt Newsletter abmelden?
                </Typography>

                <Button
                  variant="contained"
                  color="error"
                  disabled={!unsubscribeToken || loading}
                  onClick={handleUnsubscribe}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    'Newsletter abbestellen'
                  )}
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
