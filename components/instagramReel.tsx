import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    instgrm?: {
      Embeds: { process: () => void };
    };
  }
}

export function InstagramReel() {
  useEffect(() => {
    if (window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, []);

  const permalink = 'https://www.instagram.com/reel/DMSyS8ZMhOC/';

  return (
    <>
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: 3,
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px auto',
          maxWidth: 540,
          minWidth: 326,
          padding: 0,
          width: 'calc(100% - 2px)',
        }}
      >
        <a href={permalink} target="_blank" rel="noreferrer">
          Sieh dir diesen Beitrag auf Instagram an
        </a>
      </blockquote>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.instgrm?.Embeds) {
            window.instgrm.Embeds.process();
          }
        }}
      />
    </>
  );
}
