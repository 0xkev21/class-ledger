import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML shell for Web SSR / Static Rendering with NativeWind v4 & Expo Router.
 */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f7f9fa" />
        <title>Class Ledger | အတန်းရန်ပုံငွေ</title>
        <link rel="icon" href="/landing/favicon.svg" type="image/svg+xml" />

        {/* Ensures proper reset for React Native Web ScrollViews & full height */}
        <ScrollViewStyleReset />

        {/* NativeWind v4 / Expo Router injected CSS and head assets */}
        {headNodes}

        {/* Synchronously apply dark class before the page is painted to eliminate FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedMode = window.localStorage && window.localStorage.getItem('cl-theme-mode');
                  var shouldUseDark = false;
                  if (storedMode === 'dark') {
                    shouldUseDark = true;
                  } else if (storedMode === 'light') {
                    shouldUseDark = false;
                  } else {
                    var mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                    shouldUseDark = Boolean(mediaQuery && mediaQuery.matches);
                  }
                  if (shouldUseDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body {...bodyAttributes} style={{ margin: 0, padding: 0, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
        {/* Required for web script hydration and bundle loading */}
        {bodyNodes}
      </body>
    </html>
  );
}
