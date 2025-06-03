import UseSession from '@/hooks/useSession';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const session = UseSession();
  const router = useRouter();

  const appProps = Object.assign(
    {
      session,
    },
    pageProps
  );

  useEffect(() => {
    if (!router.isReady) return;
    const { code } = router.query;
    if (code && typeof code == 'string') {
      localStorage.setItem('code', code);
    }
  }, [router.isReady]);

  return <Component {...appProps} />;
}
