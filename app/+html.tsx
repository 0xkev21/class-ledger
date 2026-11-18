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
        <title>Class Ledger | အတန်းရန်ပုံငွေ</title>

        {/* Ensures proper reset for React Native Web ScrollViews & full height */}
        <ScrollViewStyleReset />

        {/* NativeWind v4 / Expo Router injected CSS and head assets */}
        {headNodes}
      </head>
      <body {...bodyAttributes} style={{ margin: 0, padding: 0, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
        {/* Required for web script hydration and bundle loading */}
        {bodyNodes}
      </body>
    </html>
  );
}
